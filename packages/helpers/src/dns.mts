import type { CacheStorageLike } from '@chainfuse/types';
import type { DurableObjectState, ExecutionContext } from '@cloudflare/workers-types/experimental';
import * as dnsPacket from 'dns-packet';
import type { Buffer } from 'node:buffer';
import * as zm from 'zod/mini';
import { CryptoHelpers } from './crypto.mts';

export enum DNSRecordType {
	'A (IPv4 Address)' = 'A',
	'AAAA (IPv6 Address)' = 'AAAA',
	'AFSDB (AFS database)' = 'AFSDB',
	'APL (Address Prefix List)' = 'APL',
	'AXFR (Zone transfer)' = 'AXFR',
	'CAA (CA authorizations)' = 'CAA',
	'CDNSKEY (Child DNSKEY)' = 'CDNSKEY',
	'CDS (Child DS)' = 'CDS',
	'CERT (Certificate)' = 'CERT',
	'CNAME (Canonical Name)' = 'CNAME',
	'DNAME (Delegation Name)' = 'DNAME',
	'DHCID (DHCP Identifier)' = 'DHCID',
	'DLV (DNSSEC Lookaside Validation)' = 'DLV',
	'DNSKEY (DNSSEC Key)' = 'DNSKEY',
	'DS (Delegation Signer)' = 'DS',
	'HINFO (Host Info)' = 'HINFO',
	'HIP (Host Identity Protocol)' = 'HIP',
	'IXFR (Incremental Zone Transfer)' = 'IXFR',
	'IPSECKEY (IPSEC Key)' = 'IPSECKEY',
	'KEY (Key record)' = 'KEY',
	'KX (Key Exchanger)' = 'KX',
	'LOC (Location)' = 'LOC',
	'MX (Mail Exchange)' = 'MX',
	'NAPTR (Name Authority Pointer)' = 'NAPTR',
	'NS (Name Server)' = 'NS',
	'NSEC (Next Secure)' = 'NSEC',
	'NSEC3 (Next Secure v3)' = 'NSEC3',
	'NSEC3PARAM (NSEC3 Parameters)' = 'NSEC3PARAM',
	'NULL (Experimental null RR)' = 'NULL',
	'OPT (EDNS Options)' = 'OPT',
	'PTR (Pointer)' = 'PTR',
	'RRSIG (DNSSEC Signature)' = 'RRSIG',
	'RP (Responsible Person)' = 'RP',
	'SIG (Signature)' = 'SIG',
	'SOA (Start of Authority)' = 'SOA',
	'SRV (Service)' = 'SRV',
	'SSHFP (SSH Fingerprint)' = 'SSHFP',
	'TA (DNSSEC Trust Anchor)' = 'TA',
	'TKEY (Transaction Key)' = 'TKEY',
	'TLSA (certificate associations)' = 'TLSA',
	'TSIG (Transaction Signature)' = 'TSIG',
	'TXT (Text)' = 'TXT',
	'URI (Uniform Resource Identifier)' = 'URI',
}

export class DnsHelpers<C extends CacheStorageLike, EC extends Pick<ExecutionContext | DurableObjectState, 'waitUntil'> = Pick<ExecutionContext | DurableObjectState, 'waitUntil'>> {
	private nameservers: URL[];
	private cache?: Promise<Cache>;
	private backgroundContext?: EC;

	public static readonly constructorArgs = zm.object({
		nameservers: zm
			.array(
				zm.codec(zm.url({ protocol: /^(https|tls)$/, hostname: zm.regexes.domain }).check(zm.trim(), zm.minLength(1)), zm.instanceof(URL), {
					decode: (urlString) => new URL(urlString),
					encode: (url) => url.href,
				}),
			)
			.check(zm.minLength(1)),
	});

	/**
	 * Create a DNS helper instance.
	 * @param args Parsed constructor args containing the resolver nameserver URLs.
	 * @param cacheStore Optional CacheStorage-like implementation to persist DNS lookups; if null, cache is disabled.
	 */
	constructor(args: zm.input<(typeof DnsHelpers)['constructorArgs']>, cacheStore?: C | null, backgroundContext?: EC) {
		const { nameservers } = DnsHelpers.constructorArgs.parse(args);

		this.nameservers = nameservers;

		if (cacheStore !== null) {
			cacheStore ??= globalThis.caches as unknown as C;

			if ('open' in cacheStore && typeof cacheStore.open === 'function') {
				this.cache = cacheStore.open('dns');
			} else {
				throw new Error('Cache store must be a CacheStorage (or equivalent of)');
			}
		}

		this.backgroundContext = backgroundContext;
	}

	public static readonly queryArgs = zm.object({
		questions: zm
			.array(
				zm.object({
					hostname: zm.string().check(
						zm.trim(),
						zm.minLength(1),
						// DNS dpec is 255 - final period and non-printed zero octect for root
						zm.maxLength(253),
						zm.regex(zm.regexes.domain),
					),
					recordType: zm._default(zm.enum(DNSRecordType), DNSRecordType['A (IPv4 Address)']),
				}),
			)
			.check(zm.minLength(1)),
		flags: zm._default(
			zm.object({
				recursion: zm._default(zm.boolean(), true),
				dnssecCheck: zm._default(zm.boolean(), true),
			}),
			{ recursion: true, dnssecCheck: true },
		),
		timeout: zm.union([
			zm.instanceof(AbortSignal),
			zm.pipe(
				zm._default(zm.int().check(zm.positive()), 30 * 1000),
				zm.transform((ms) => AbortSignal.timeout(ms)),
			),
		]),
	});
	public query(_args: zm.input<(typeof DnsHelpers)['queryArgs']>) {
		const args = DnsHelpers.queryArgs.parse(_args);
		// Throw immediately if already aborted
		args.timeout.throwIfAborted();

		return Promise.race([
			// Passthrough signal and carry over the rest
			this._query(args.timeout, args.questions, args.flags),
			// Shortcircuit on abort
			new Promise<never>((_, reject) =>
				args.timeout.addEventListener(
					'abort',
					() => {
						if (args.timeout.reason instanceof DOMException) {
							reject(new Error(`${args.timeout.reason.name}: ${args.timeout.reason.message}`, { cause: args.timeout.reason.cause }));
						} else if (args.timeout.reason instanceof Error) {
							reject(args.timeout.reason);
						} else if (typeof args.timeout.reason === 'string') {
							reject(new Error(args.timeout.reason));
						} else if (args.timeout.reason) {
							reject(new Error(JSON.stringify(args.timeout.reason)));
						} else {
							reject(new Error('AbortError'));
						}
					},
					{ once: true },
				),
			),
		]);
	}

	private async _query(signal: AbortSignal, questions: zm.output<(typeof DnsHelpers)['queryArgs']>['questions'], flags: zm.output<(typeof DnsHelpers)['queryArgs']>['flags']) {
		let cacheRequest: Request | undefined;
		let computedflags = 0;
		if ('recursion' in flags && flags.recursion === true) {
			computedflags |= dnsPacket.RECURSION_DESIRED;
		}
		if ('dnssecCheck' in flags) {
			if (flags.dnssecCheck) {
				computedflags |= dnsPacket.DNSSEC_OK;
			} else {
				computedflags |= dnsPacket.CHECKING_DISABLED;
			}
		}
		let responsePacket: Readonly<dnsPacket.Packet> | undefined;
		const errors: Error[] = [];

		for (const nameserver of this.nameservers) {
			// Reset
			cacheRequest = undefined;
			responsePacket = undefined;

			if (this.cache) {
				const cacheServerUrl = new URL(nameserver);
				// Cache hard requires http or https protocol
				cacheServerUrl.protocol = 'https:';
				// For cache niceness, follow similar to `application/dns-json` format
				cacheServerUrl.searchParams.set('questions', await CryptoHelpers.getHash('SHA-256', JSON.stringify(questions)));
				cacheServerUrl.searchParams.set('flags', computedflags.toString());
				cacheRequest = new Request(cacheServerUrl, { headers: { Accept: 'application/dns-json' }, signal });

				responsePacket = await (await this.cache).match(cacheRequest).then((response) => {
					if (response?.ok) {
						return response.json().then((json) => json as dnsPacket.Packet);
					} else {
						return undefined;
					}
				});
			}
			const fromCache = Boolean(responsePacket);

			try {
				responsePacket ??= await (() => {
					const queryPacket: dnsPacket.Packet = {
						type: 'query',
						// 1 (inclusive) to 65536 (exclusive)
						id: Math.floor(Math.random() * 65535) + 1,
						flags: computedflags,
						questions: questions.map((q) => ({
							name: q.hostname,
							type: q.recordType,
							class: 'IN',
						})),
					};

					if (nameserver.protocol === 'https:') {
						const dnsQueryBuf = dnsPacket.encode(queryPacket);

						return fetch(nameserver, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/dns-message',
								Accept: 'application/dns-message',
							},
							signal,
							body: new Uint8Array(dnsQueryBuf),
						})
							.then(async (response) => {
								if (response.ok) {
									return response.arrayBuffer();
								} else {
									throw new Error(`${response?.status} ${response?.statusText}`, { cause: await response?.text() });
								}
							})
							.then((buf) => import('node:buffer').then(({ Buffer }) => dnsPacket.decode(Buffer.from(buf))));
					} else if (nameserver.protocol === 'tls:') {
						const dnsQueryBuf = dnsPacket.streamEncode(queryPacket);

						return Promise.all([import('node:tls'), import('node:buffer')]).then(
							([{ connect }, { Buffer }]) =>
								new Promise<dnsPacket.Packet>((resolve, reject) => {
									// Setup TLS client
									const client = connect(
										{
											// RFC 7858 requires 1.2+
											minVersion: 'TLSv1.2',
											port: nameserver.port === '' ? 853 : parseInt(nameserver.port, 10),
											host: nameserver.hostname,
											...(nameserver.pathname !== '' && { path: nameserver.pathname }),
										},
										() => {
											client.write(dnsQueryBuf);
										},
									);
									// Setup abort handling
									const onAbort = () => {
										const error = (() => {
											if (signal.reason instanceof DOMException) {
												return new Error(`${signal.reason.name}: ${signal.reason.message}`, { cause: signal.reason.cause });
											} else if (signal.reason instanceof Error) {
												return signal.reason;
											} else if (typeof signal.reason === 'string') {
												return new Error(signal.reason);
											} else if (signal.reason) {
												return new Error(JSON.stringify(signal.reason));
											} else {
												return new Error('AbortError');
											}
										})();
										client.destroy(error);
										reject(error);
									};
									signal.addEventListener('abort', onAbort, { once: true });
									// Finish setting up client
									client.once('error', reject);

									let rawBody = Buffer.from(new Uint8Array(0));
									let expectedLength = 0;

									client.on('data', (data: Buffer) => {
										if (rawBody.byteLength === 0) {
											expectedLength = data.readUInt16BE(0);
											if (expectedLength < 12) {
												reject(new Error('Below DNS minimum packet length (DNS Header is 12 bytes)'));
											}
											rawBody = Buffer.from(data);
										} else {
											rawBody = Buffer.concat([rawBody, data]);
										}

										/**
										 * @link https://tools.ietf.org/html/rfc7858#section-3.3
										 * @link https://tools.ietf.org/html/rfc1035#section-4.2.2
										 * The message is prefixed with a two byte length field which gives the message length, excluding the two byte length field.
										 */
										if (rawBody.length === expectedLength + 2) {
											client.destroy();

											resolve(dnsPacket.streamDecode(rawBody));
										}
									});
									client.once('end', () => signal.removeEventListener('abort', onAbort));
								}),
						);
					} else {
						throw new Error(`Unsupported protocol: ${nameserver.protocol}`);
					}
				})().then(async (packet) => {
					const formattedPacket = {
						...packet,
						answers: await import('node:buffer').then(({ Buffer }) =>
							(packet.answers ?? []).map((a) => {
								if ('data' in a) {
									if (Array.isArray(a.data)) {
										return { ...a, data: a.data.map((part) => (typeof part === 'string' ? part : part.toString('utf8'))) };
									} else if (Buffer.isBuffer(a.data)) {
										return { ...a, data: a.data.toString('utf8') };
									} else if (typeof a.data === 'object') {
										return { ...a, data: a.data };
									} else {
										return { ...a, data: a.data.toString() };
									}
								} else {
									return a;
								}
							}),
						),
					} as const;

					if (this.cache && !fromCache) {
						// Re-assign response to make it mutable
						const cacheResponse = new Response(JSON.stringify(formattedPacket), { headers: { 'Content-Type': 'application/dns-json' } });

						const cachePromise = (async () => {
							const answersWithTtl = (formattedPacket.answers ?? []).filter((a) => 'ttl' in a);
							const ttl = answersWithTtl.length > 0 ? Math.min(...answersWithTtl.map((a) => ('ttl' in a ? a.ttl! : 0))) : 0;
							cacheResponse.headers.set('Cache-Control', `public, max-age=${ttl}, s-maxage=${ttl}`);

							await CryptoHelpers.generateETag(cacheResponse)
								.then((etag) => cacheResponse.headers.set('ETag', etag))
								.catch((err) => console.warn('ETag generation failed', err));

							return (await this.cache)!.put(cacheRequest!, cacheResponse);
						})();

						if (this.backgroundContext) {
							this.backgroundContext.waitUntil(cachePromise);
						} else {
							await cachePromise;
						}
					}

					// Go back to nice JSON format
					return formattedPacket as dnsPacket.Packet;
				});
				if (responsePacket) break;
			} catch (err) {
				errors.push(err instanceof Error ? err : new Error(String(err)));
				continue;
			}
		}

		if (responsePacket) {
			return {
				flags: {
					'Official Authority': Boolean((responsePacket.flags ?? 0) & dnsPacket.AUTHORITATIVE_ANSWER),
					'DNSSEC Verified': Boolean((responsePacket.flags ?? 0) & dnsPacket.AUTHENTIC_DATA),
					'Recursion Available': Boolean((responsePacket.flags ?? 0) & dnsPacket.RECURSION_AVAILABLE),
					Truncated: Boolean((responsePacket.flags ?? 0) & dnsPacket.TRUNCATED_RESPONSE),
				},
				answers: responsePacket.answers,
			} as const;
		} else {
			if (errors.length > 0) {
				throw new AggregateError(errors, 'No nameserver responded');
			}
			throw new Error('No nameserver responded');
		}
	}
}
