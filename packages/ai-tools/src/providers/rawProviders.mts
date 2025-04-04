import type { OpenAICompatibleProvider } from '@ai-sdk/openai-compatible';
import { BufferHelpers, CryptoHelpers, Helpers } from '@chainfuse/helpers';
import type { cloudflareModelPossibilities } from '@chainfuse/types';
import type { GatewayOptions } from '@cloudflare/workers-types/experimental';
import { AiBase } from '../base.mjs';
import type { AiConfigWorkersaiRest, AiRequestConfig, AiRequestMetadata, AiRequestMetadataStringified, Servers } from '../types.mjs';

export class AiRawProviders extends AiBase {
	// 2628288 seconds is what cf defines as 1 month in their cache rules
	private readonly cacheTtl = 2628288;

	private static serverTimingHeader(metrics: Record<string, number>) {
		return Object.entries(metrics)
			.map(([name, duration]) => `${name};dur=${duration}`)
			.join(', ');
	}
	private async updateGatewayLog(response: Response, metadataHeader: AiRequestMetadataStringified, startRoundTrip: ReturnType<typeof performance.now>, modelTime?: number) {
		const logId = response.headers.get('cf-aig-log-id');

		const rawMetadata: AiRequestMetadata = {
			...(metadataHeader as unknown as AiRequestMetadata),
			serverInfo: {
				...(JSON.parse(metadataHeader.serverInfo) as AiRequestMetadata['serverInfo']),
				timing: {
					fromCache: response.headers.get('cf-aig-cache-status')?.toLowerCase() === 'hit',
					totalRoundtripTime: performance.now() - startRoundTrip,
					modelTime,
				},
			},
		};

		if (logId) {
			const updateMetadata = import('@chainfuse/helpers')
				.then(({ NetHelpers }) => NetHelpers.cfApi(this.config.gateway.apiToken))
				.then((cf) =>
					cf.aiGateway.logs.edit(this.gatewayName, logId, {
						account_id: this.config.gateway.accountId,
						metadata: {
							...Object.entries(rawMetadata).reduce((acc, [key, value]) => {
								acc[key as keyof AiRequestMetadata] = typeof value === 'string' ? value : JSON.stringify(value);
								return acc;
							}, {} as AiRequestMetadataStringified),
						} satisfies AiRequestMetadataStringified,
					}),
				);

			if (this.config.backgroundContext) {
				this.config.backgroundContext.waitUntil(updateMetadata);
			} else {
				await updateMetadata;
			}
		} else {
			console.warn('Not updating gateway log, no cf-aig-log-id header');
		}

		return AiRawProviders.serverTimingHeader({
			total: rawMetadata.serverInfo.timing!.totalRoundtripTime,
			...(rawMetadata.serverInfo.timing?.modelTime && { model: rawMetadata.serverInfo.timing.modelTime }),
		});
	}

	public oaiOpenai(args: AiRequestConfig) {
		return import('@ai-sdk/openai').then(async ({ createOpenAI }) =>
			createOpenAI({
				baseURL: new URL(['v1', this.config.gateway.accountId, this.gatewayName, 'openai'].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
				apiKey: this.config.providers.openAi.apiToken,
				organization: this.config.providers.openAi.organization,
				headers: {
					'cf-aig-authorization': `Bearer ${this.config.gateway.apiToken}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
						...(args.groupBillingId && { groupBillingId: (await BufferHelpers.uuidConvert(args.groupBillingId)).utf8 }),
						serverInfo: JSON.stringify({
							name: 'openai',
						} satisfies AiRequestMetadata['serverInfo']),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8.slice(0, 23) as AiRequestMetadata['idempotencyId']),
						executor: JSON.stringify(args.executor),
					} satisfies AiRequestMetadataStringified),
					...(args.cache && { 'cf-aig-cache-ttl': (typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache).toString() }),
					...(args.skipCache && { 'cf-aig-skip-cache': 'true' }),
				},
				compatibility: 'strict',
				fetch: async (input, rawInit) => {
					const startRoundTrip = performance.now();

					const headers = new Headers(rawInit?.headers);
					const metadataHeader = JSON.parse(headers.get('cf-aig-metadata')!) as AiRequestMetadataStringified;
					if (metadataHeader.idempotencyId.split('-').length === 4) {
						metadataHeader.idempotencyId = `${metadataHeader.idempotencyId}-${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(0, 12)}` as AiRequestMetadata['idempotencyId'];
						headers.set('cf-aig-metadata', JSON.stringify(metadataHeader));
					}

					if (args.logging ?? this.gatewayLog) console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return fetch(input, { ...rawInit, headers }).then(async (response) => {
						if (args.logging ?? this.gatewayLog) console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						const serverTiming = await this.updateGatewayLog(response, metadataHeader, startRoundTrip, response.headers.has('openai-processing-ms') ? parseInt(response.headers.get('openai-processing-ms')!) : undefined);

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);
						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);
						mutableHeaders.set('Server-Timing', serverTiming);
						if (response.ok) {
							return new Response(response.body, { ...response, headers: mutableHeaders });
						} else {
							const [body1, body2] = response.body!.tee();

							console.error('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

							return new Response(body2, { ...response, headers: mutableHeaders });
						}
					});
				},
			}),
		);
	}

	public azOpenai(args: AiRequestConfig, server: Servers[number], cost?: { inputTokenCost?: number; outputTokenCost?: number }) {
		return import('@ai-sdk/azure').then(async ({ createAzure }) =>
			createAzure({
				apiKey: this.config.providers.azureOpenAi.apiTokens[`AZURE_API_KEY_${server.id.toUpperCase().replaceAll('-', '_')}`]!,
				/**
				 * @link https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#api-specs
				 * From the table, pick the `Latest GA release` for `Data plane - inference`
				 */
				apiVersion: '2024-10-21',
				baseURL: new URL(['v1', this.config.gateway.accountId, this.gatewayName, 'azure-openai', server.id.toLowerCase()].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
				headers: {
					'cf-aig-authorization': `Bearer ${this.config.gateway.apiToken}`,
					...(cost && { 'cf-aig-custom-cost': JSON.stringify({ per_token_in: cost.inputTokenCost ?? undefined, per_token_out: cost.outputTokenCost ?? undefined }) }),
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
						...(args.groupBillingId && { groupBillingId: (await BufferHelpers.uuidConvert(args.groupBillingId)).utf8 }),
						serverInfo: JSON.stringify({
							name: `azure-${server.id}`,
							distance: await import('haversine-distance').then(async ({ default: haversine }) =>
								haversine(
									await import('../serverSelector.mts').then(({ ServerSelector }) =>
										new ServerSelector(this.config).determineLocation().then(({ coordinate }) => ({
											lat: Helpers.precisionFloat(coordinate.lat),
											lon: Helpers.precisionFloat(coordinate.lon),
										})),
									),
									{
										lat: Helpers.precisionFloat(server.coordinate.lat),
										lon: Helpers.precisionFloat(server.coordinate.lon),
									},
								),
							),
						} satisfies AiRequestMetadata['serverInfo']),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8.slice(0, 23) as AiRequestMetadata['idempotencyId']),
						executor: JSON.stringify(args.executor),
					} satisfies AiRequestMetadataStringified),
					...(args.cache && { 'cf-aig-cache-ttl': (typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache).toString() }),
					...(args.skipCache && { 'cf-aig-skip-cache': 'true' }),
				},
				fetch: async (input, rawInit) => {
					const startRoundTrip = performance.now();

					const headers = new Headers(rawInit?.headers);
					const metadataHeader = JSON.parse(headers.get('cf-aig-metadata')!) as AiRequestMetadataStringified;
					if (metadataHeader.idempotencyId.split('-').length === 4) {
						metadataHeader.idempotencyId = `${metadataHeader.idempotencyId}-${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(0, 12)}` as AiRequestMetadata['idempotencyId'];
						headers.set('cf-aig-metadata', JSON.stringify(metadataHeader));
					}

					if (args.logging ?? this.gatewayLog) console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return fetch(input, { ...rawInit, headers }).then(async (response) => {
						if (args.logging ?? this.gatewayLog) console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						const serverTiming = await this.updateGatewayLog(response, metadataHeader, startRoundTrip, response.headers.has('x-envoy-upstream-service-time') ? parseInt(response.headers.get('x-envoy-upstream-service-time')!) : undefined);

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);
						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);
						mutableHeaders.set('Server-Timing', serverTiming);
						if (response.ok) {
							return new Response(response.body, { ...response, headers: mutableHeaders });
						} else {
							const [body1, body2] = response.body!.tee();

							console.error('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

							return new Response(body2, { ...response, headers: mutableHeaders });
						}
					});
				},
			}),
		);
	}

	public anthropic(args: AiRequestConfig) {
		return import('@ai-sdk/anthropic').then(async ({ createAnthropic }) =>
			createAnthropic({
				baseURL: new URL(['v1', this.config.gateway.accountId, this.gatewayName, 'anthropic'].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
				apiKey: this.config.providers.anthropic.apiToken,
				headers: {
					'cf-aig-authorization': `Bearer ${this.config.gateway.apiToken}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
						...(args.groupBillingId && { groupBillingId: (await BufferHelpers.uuidConvert(args.groupBillingId)).utf8 }),
						serverInfo: JSON.stringify({
							name: 'anthropic',
						} satisfies AiRequestMetadata['serverInfo']),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8.slice(0, 23) as AiRequestMetadata['idempotencyId']),
						executor: JSON.stringify(args.executor),
					} satisfies AiRequestMetadataStringified),
					...(args.cache && { 'cf-aig-cache-ttl': (typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache).toString() }),
					...(args.skipCache && { 'cf-aig-skip-cache': 'true' }),
				},
				fetch: async (input, rawInit) => {
					const startRoundTrip = performance.now();

					const headers = new Headers(rawInit?.headers);
					const metadataHeader = JSON.parse(headers.get('cf-aig-metadata')!) as AiRequestMetadataStringified;
					if (metadataHeader.idempotencyId.split('-').length === 4) {
						metadataHeader.idempotencyId = `${metadataHeader.idempotencyId}-${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(0, 12)}` as AiRequestMetadata['idempotencyId'];
						headers.set('cf-aig-metadata', JSON.stringify(metadataHeader));
					}

					if (args.logging ?? this.gatewayLog) console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return fetch(input, { ...rawInit, headers }).then(async (response) => {
						if (args.logging ?? this.gatewayLog) console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						const serverTiming = await this.updateGatewayLog(response, metadataHeader, startRoundTrip);

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);
						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);
						mutableHeaders.set('Server-Timing', serverTiming);
						if (response.ok) {
							return new Response(response.body, { ...response, headers: mutableHeaders });
						} else {
							const [body1, body2] = response.body!.tee();

							console.error('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

							return new Response(body2, { ...response, headers: mutableHeaders });
						}
					});
				},
			}),
		);
	}

	public custom(args: AiRequestConfig) {
		if (this.config.providers.custom?.url) {
			return import('zod')
				.then(({ z }) =>
					// Verify that the custom provider url is a valid URL
					z
						.string()
						.trim()
						.url()
						.transform((url) => new URL(url))
						.parseAsync(this.config.providers.custom!.url)
						.then((customProviderUrl) =>
							// Verify that the custom provider url is not an IP address
							z
								.string()
								.trim()
								.ip()
								.safeParseAsync(customProviderUrl.hostname)
								.then(({ success }) => ({ customProviderUrl, success })),
						),
				)
				.then(async ({ customProviderUrl, success }) => {
					if (success) {
						throw new Error('IP custom providers not allowed');
					} else {
						// Run domain through ZT policies
						const doh = await import('@chainfuse/helpers').then(({ DnsHelpers }) => new DnsHelpers(new URL('dns-query', `https://${this.config.providers.custom?.dohId}.cloudflare-gateway.com`)));

						const aCheck = doh.query(customProviderUrl.hostname, 'A', undefined, undefined, 2 * 1000);
						const aaaaCheck = doh.query(customProviderUrl.hostname, 'AAAA', undefined, undefined, 2 * 1000);

						return Promise.allSettled([aCheck, aaaaCheck]).then((checks) => {
							const fulfulledChecks = checks.filter((check) => check.status === 'fulfilled');
							/**
							 * Blocked domains return 0.0.0.0 or :: as the answer
							 * @link https://developers.cloudflare.com/cloudflare-one/policies/gateway/block-page/
							 */
							if (fulfulledChecks.length > 0 && fulfulledChecks.some((obj) => 'Answer' in obj.value && Array.isArray(obj.value.Answer) && obj.value.Answer.some((answer) => answer.data !== '0.0.0.0' && answer.data !== '::'))) {
								// ZT Pass, perform the calls
								return import('@ai-sdk/openai-compatible').then(async ({ createOpenAICompatible }) =>
									createOpenAICompatible({
										baseURL: customProviderUrl.toString(),
										...(this.config.providers.custom?.apiToken && { apiKey: this.config.providers.custom.apiToken }),
										headers: {
											// ZT Auth if present
											...(this.config.providers.custom &&
												'clientId' in this.config.providers.custom &&
												this.config.providers.custom.clientId &&
												'clientSecret' in this.config.providers.custom &&
												this.config.providers.custom.clientSecret && {
													'CF-Access-Client-Id': this.config.providers.custom.clientId,
													'CF-Access-Client-Secret': this.config.providers.custom.clientSecret,
												}),
											'X-Dataspace-Id': (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
											'X-Executor': JSON.stringify(args.executor),
											// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
											'X-Idempotency-Id': args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8.slice(0, 23) as AiRequestMetadata['idempotencyId']),
											// Request to skip or custom cache duration (no guarantee that upstream server will respect it)
											// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
											...((args.skipCache || args.cache) && { 'Cache-Control': [args.skipCache && 'no-cache', args.cache && `max-age=${typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache}`].join(', ') }),
										},
										name: 'custom',
										fetch: async (input, rawInit) => {
											const headers = new Headers(rawInit?.headers);
											let idempotencyId = headers.get('X-Idempotency-Id')! as AiRequestMetadata['idempotencyId'];
											if (idempotencyId.split('-').length === 4) {
												idempotencyId = `${idempotencyId}-${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(0, 12)}` as AiRequestMetadata['idempotencyId'];
												headers.set('X-Idempotency-Id', idempotencyId);
											}

											if (args.logging ?? this.gatewayLog) console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(idempotencyId))(`[${idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

											return fetch(input, { ...rawInit, headers }).then(async (response) => {
												if (args.logging ?? this.gatewayLog) console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(idempotencyId))(`[${idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

												// Inject it to have it available for retries
												const mutableHeaders = new Headers(response.headers);
												mutableHeaders.set('X-Idempotency-Id', idempotencyId);

												if (response.ok) {
													return new Response(response.body, { ...response, headers: mutableHeaders });
												} else {
													const [body1, body2] = response.body!.tee();

													console.error('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(idempotencyId))(`[${idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

													return new Response(body2, { ...response, headers: mutableHeaders });
												}
											});
										},
									}),
								);
							} else {
								throw new Error('Failed ZT check on custom provider url');
							}
						});
					}
				})
				.catch(() => {
					throw new Error('Invalid custom provider url');
				});
		} else {
			// This always gets called, only throw error if actually being used
			return import('@ai-sdk/openai-compatible').then(({ createOpenAICompatible }) =>
				createOpenAICompatible({
					// Dummy url that'll never be hit
					baseURL: 'https://sushidata.com',
					name: 'custom',
					// eslint-disable-next-line @typescript-eslint/require-await
					fetch: async () => {
						throw new Error('Custom provider not configured');
					},
				}),
			);
		}
	}

	public googleAi(args: AiRequestConfig) {
		return import('@ai-sdk/google').then(async ({ createGoogleGenerativeAI }) =>
			createGoogleGenerativeAI({
				/**
				 * `v1beta` is the only one that supports function calls as of now
				 * @link https://ai.google.dev/gemini-api/docs/api-versions
				 */
				baseURL: new URL(['v1', this.config.gateway.accountId, this.gatewayName, 'google-ai-studio', 'v1beta'].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
				apiKey: this.config.providers.googleAi.apiToken,
				headers: {
					'cf-aig-authorization': `Bearer ${this.config.gateway.apiToken}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
						...(args.groupBillingId && { groupBillingId: (await BufferHelpers.uuidConvert(args.groupBillingId)).utf8 }),
						serverInfo: JSON.stringify({
							name: 'googleai',
						} satisfies AiRequestMetadata['serverInfo']),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8.slice(0, 23) as AiRequestMetadata['idempotencyId']),
						executor: JSON.stringify(args.executor),
					} satisfies AiRequestMetadataStringified),
					...(args.cache && { 'cf-aig-cache-ttl': (typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache).toString() }),
					...(args.skipCache && { 'cf-aig-skip-cache': 'true' }),
				},
				fetch: async (input, rawInit) => {
					const startRoundTrip = performance.now();

					const headers = new Headers(rawInit?.headers);
					const metadataHeader = JSON.parse(headers.get('cf-aig-metadata')!) as AiRequestMetadataStringified;
					if (metadataHeader.idempotencyId.split('-').length === 4) {
						metadataHeader.idempotencyId = `${metadataHeader.idempotencyId}-${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(0, 12)}` as AiRequestMetadata['idempotencyId'];
						headers.set('cf-aig-metadata', JSON.stringify(metadataHeader));
					}

					if (args.logging ?? this.gatewayLog) console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return fetch(input, { ...rawInit, headers }).then(async (response) => {
						if (args.logging ?? this.gatewayLog) console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						const serverTiming = await this.updateGatewayLog(response, metadataHeader, startRoundTrip);

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);
						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);
						mutableHeaders.set('Server-Timing', serverTiming);
						if (response.ok) {
							return new Response(response.body, { ...response, headers: mutableHeaders });
						} else {
							const [body1, body2] = response.body!.tee();

							console.error('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

							return new Response(body2, { ...response, headers: mutableHeaders });
						}
					});
				},
			}),
		);
	}

	public restWorkersAi(args: AiRequestConfig): Promise<OpenAICompatibleProvider<cloudflareModelPossibilities<'Text Generation'>, cloudflareModelPossibilities<'Text Generation'>, cloudflareModelPossibilities<'Text Embeddings'>>> {
		return import('@ai-sdk/openai-compatible').then(async ({ createOpenAICompatible }) =>
			createOpenAICompatible({
				baseURL: new URL(['v1', this.config.gateway.accountId, this.gatewayName, 'workers-ai', 'v1'].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
				apiKey: (this.config.providers.workersAi as AiConfigWorkersaiRest).apiToken,
				headers: {
					'cf-aig-authorization': `Bearer ${this.config.gateway.apiToken}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
						...(args.groupBillingId && { groupBillingId: (await BufferHelpers.uuidConvert(args.groupBillingId)).utf8 }),
						serverInfo: JSON.stringify({
							name: 'cloudflare',
						} satisfies AiRequestMetadata['serverInfo']),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8.slice(0, 23) as AiRequestMetadata['idempotencyId']),
						executor: JSON.stringify(args.executor),
					} satisfies AiRequestMetadataStringified),
					...(args.cache && { 'cf-aig-cache-ttl': (typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache).toString() }),
					...(args.skipCache && { 'cf-aig-skip-cache': 'true' }),
				},
				name: 'workersai',
				fetch: async (input, rawInit) => {
					const startRoundTrip = performance.now();

					const headers = new Headers(rawInit?.headers);
					const metadataHeader = JSON.parse(headers.get('cf-aig-metadata')!) as AiRequestMetadataStringified;
					if (metadataHeader.idempotencyId.split('-').length === 4) {
						metadataHeader.idempotencyId = `${metadataHeader.idempotencyId}-${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(0, 12)}` as AiRequestMetadata['idempotencyId'];
						headers.set('cf-aig-metadata', JSON.stringify(metadataHeader));
					}

					if (args.logging ?? this.gatewayLog) console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return fetch(input, { ...rawInit, headers }).then(async (response) => {
						if (args.logging ?? this.gatewayLog) console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						const serverTiming = await this.updateGatewayLog(response, metadataHeader, startRoundTrip);

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);
						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);
						mutableHeaders.set('Server-Timing', serverTiming);

						if (response.ok) {
							return new Response(response.body, { ...response, headers: mutableHeaders });
						} else {
							const [body1, body2] = response.body!.tee();

							console.error('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

							return new Response(body2, { ...response, headers: mutableHeaders });
						}
					});
				},
			}),
		);
	}

	public async bindingWorkersAi(args: AiRequestConfig) {
		return import('workers-ai-provider').then(
			async ({ createWorkersAI }) =>
				createWorkersAI({
					binding: this.config.providers.workersAi,
					gateway: {
						id: this.gatewayName,
						...(args.cache && { cacheTtl: typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache }),
						...(args.skipCache && { skipCache: true }),
						metadata: {
							dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
							...(args.groupBillingId && { groupBillingId: (await BufferHelpers.uuidConvert(args.groupBillingId)).utf8 }),
							serverInfo: JSON.stringify({
								name: 'cloudflare',
							} satisfies AiRequestMetadata['serverInfo']),
							// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
							idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8.slice(0, 23) as AiRequestMetadata['idempotencyId']),
							executor: JSON.stringify(args.executor),
						} satisfies AiRequestMetadataStringified,
					} satisfies GatewayOptions,
				}) as unknown as Promise<OpenAICompatibleProvider<cloudflareModelPossibilities<'Text Generation'>, cloudflareModelPossibilities<'Text Generation'>>>,
		);
	}
}
