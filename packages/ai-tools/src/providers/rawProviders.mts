import type { OpenAICompatibleProvider } from '@ai-sdk/openai-compatible';
import { BufferHelpers, CryptoHelpers, DnsHelpers, Helpers } from '@chainfuse/helpers';
import type { cloudflareModelPossibilities } from '@chainfuse/types';
import haversine from 'haversine-distance';
import { z } from 'zod';
import { AiBase } from '../base.mjs';
import type { Server } from '../serverSelector/types.mjs';
import type { AiConfigWorkersaiRest, AiRequestConfig, AiRequestIdempotencyId, AiRequestMetadata, AiRequestMetadataTiming } from '../types.mjs';

export class AiRawProviders extends AiBase {
	// 2628288 seconds is what cf defines as 1 month in their cache rules
	private readonly cacheTtl = 2628288;

	private async updateGatewayLog(response: Response, metadataHeader: AiRequestMetadata, startRoundTrip: ReturnType<typeof performance.now>, modelTime?: number) {
		/**
		 * @todo `cloudflare` rest package not updated to this endpoint yet
		 */
		const updateMetadata = fetch(new URL(['client', 'v4', 'accounts', this.config.gateway.accountId, 'ai-gateway', 'gateways', this.config.environment, 'logs', response.headers.get('cf-aig-log-id')].join('/'), 'https://api.cloudflare.com'), {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${this.config.gateway.apiToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				metadata: {
					...metadataHeader,
					timing: JSON.stringify({
						fromCache: response.headers.get('cf-aig-cache-status')?.toLowerCase() === 'hit',
						totalRoundtripTime: performance.now() - startRoundTrip,
						modelTime,
					} satisfies AiRequestMetadataTiming),
				} satisfies AiRequestMetadata,
			}),
		});

		if (this.config.backgroundContext) {
			this.config.backgroundContext.waitUntil(updateMetadata);
		} else {
			await updateMetadata;
		}
	}

	public oaiOpenai(args: AiRequestConfig) {
		return import('@ai-sdk/openai').then(async ({ createOpenAI }) =>
			createOpenAI({
				baseURL: new URL(['v1', this.config.gateway.accountId, this.config.environment, 'openai'].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
				apiKey: this.config.providers.openAi.apiToken,
				organization: this.config.providers.openAi.organization,
				headers: {
					'cf-aig-authorization': `Bearer ${this.config.gateway.apiToken}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
						executor: JSON.stringify(args.executor satisfies Exclude<AiRequestMetadata['executor'], string>),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8.slice(0, 23) as AiRequestIdempotencyId),
						serverInfo: JSON.stringify({
							name: 'openai',
						} satisfies Exclude<AiRequestMetadata['serverInfo'], string>),
						/**
						 * Blank at first, add after request finishes
						 * CF AI Gateway allows only editing existing metadata not creating new ones after the request is made
						 */
						timing: JSON.stringify({}),
					} satisfies AiRequestMetadata),
					...(args.cache && { 'cf-aig-cache-ttl': (typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache).toString() }),
					...(args.skipCache && { 'cf-aig-skip-cache': 'true' }),
				},
				compatibility: 'strict',
				fetch: async (input, rawInit) => {
					const startRoundTrip = performance.now();

					const headers = new Headers(rawInit?.headers);
					const metadataHeader = JSON.parse(headers.get('cf-aig-metadata')!) as AiRequestMetadata;
					if (metadataHeader.idempotencyId.split('-').length === 4) {
						metadataHeader.idempotencyId = `${metadataHeader.idempotencyId}-${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(0, 12)}` as AiRequestIdempotencyId;
						headers.set('cf-aig-metadata', JSON.stringify(metadataHeader));
					}

					if (args.logging ?? this.config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return fetch(input, { ...rawInit, headers }).then(async (response) => {
						if (args.logging ?? this.config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						await this.updateGatewayLog(response, metadataHeader, startRoundTrip, response.headers.has('openai-processing-ms') ? parseInt(response.headers.get('openai-processing-ms')!) : undefined);

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);
						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);

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

	public azOpenai(args: AiRequestConfig, server: Server) {
		return import('@ai-sdk/azure').then(async ({ createAzure }) =>
			createAzure({
				apiKey: this.config.providers.azureOpenAi.apiTokens[`AZURE_API_KEY_${server.id.toUpperCase().replaceAll('-', '_')}`]!,
				/**
				 * @link https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#api-specs
				 * From the table, pick the `Latest GA release` for `Data plane - inference`
				 */
				apiVersion: '2024-10-21',
				baseURL: new URL(['v1', this.config.gateway.accountId, this.config.environment, 'azure-openai', server.id.toLowerCase()].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
				headers: {
					'cf-aig-authorization': `Bearer ${this.config.gateway.apiToken}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
						executor: JSON.stringify(args.executor satisfies Exclude<AiRequestMetadata['executor'], string>),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8.slice(0, 23) as AiRequestIdempotencyId),
						serverInfo: JSON.stringify({
							name: `azure-${server.id}`,
							distance: haversine(
								{
									lat: Helpers.precisionFloat(this.config.geoRouting?.userCoordinate?.lat ?? '0'),
									lon: Helpers.precisionFloat(this.config.geoRouting?.userCoordinate?.lon ?? '0'),
								},
								server.coordinate,
							),
						} satisfies Exclude<AiRequestMetadata['serverInfo'], string>),
						/**
						 * Blank at first, add after request finishes
						 * CF AI Gateway allows only editing existing metadata not creating new ones after the request is made
						 */
						timing: JSON.stringify({}),
					} satisfies AiRequestMetadata),
					...(args.cache && { 'cf-aig-cache-ttl': (typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache).toString() }),
					...(args.skipCache && { 'cf-aig-skip-cache': 'true' }),
				},
				fetch: async (input, rawInit) => {
					const startRoundTrip = performance.now();

					const headers = new Headers(rawInit?.headers);
					const metadataHeader = JSON.parse(headers.get('cf-aig-metadata')!) as AiRequestMetadata;
					if (metadataHeader.idempotencyId.split('-').length === 4) {
						metadataHeader.idempotencyId = `${metadataHeader.idempotencyId}-${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(0, 12)}` as AiRequestIdempotencyId;
						headers.set('cf-aig-metadata', JSON.stringify(metadataHeader));
					}

					if (args.logging ?? this.config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return fetch(input, { ...rawInit, headers }).then(async (response) => {
						if (args.logging ?? this.config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						await this.updateGatewayLog(response, metadataHeader, startRoundTrip, response.headers.has('x-envoy-upstream-service-time') ? parseInt(response.headers.get('x-envoy-upstream-service-time')!) : undefined);

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);
						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);

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
				baseURL: new URL(['v1', this.config.gateway.accountId, this.config.environment, 'anthropic'].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
				apiKey: this.config.providers.anthropic.apiToken,
				headers: {
					'cf-aig-authorization': `Bearer ${this.config.gateway.apiToken}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
						executor: JSON.stringify(args.executor satisfies Exclude<AiRequestMetadata['executor'], string>),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8.slice(0, 23) as AiRequestIdempotencyId),
						serverInfo: JSON.stringify({
							name: 'anthropic',
						} satisfies Exclude<AiRequestMetadata['serverInfo'], string>),
						/**
						 * Blank at first, add after request finishes
						 * CF AI Gateway allows only editing existing metadata not creating new ones after the request is made
						 */
						timing: JSON.stringify({}),
					} satisfies AiRequestMetadata),
					...(args.cache && { 'cf-aig-cache-ttl': (typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache).toString() }),
					...(args.skipCache && { 'cf-aig-skip-cache': 'true' }),
				},
				fetch: async (input, rawInit) => {
					const startRoundTrip = performance.now();

					const headers = new Headers(rawInit?.headers);
					const metadataHeader = JSON.parse(headers.get('cf-aig-metadata')!) as AiRequestMetadata;
					if (metadataHeader.idempotencyId.split('-').length === 4) {
						metadataHeader.idempotencyId = `${metadataHeader.idempotencyId}-${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(0, 12)}` as AiRequestIdempotencyId;
						headers.set('cf-aig-metadata', JSON.stringify(metadataHeader));
					}

					if (args.logging ?? this.config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return fetch(input, { ...rawInit, headers }).then(async (response) => {
						if (args.logging ?? this.config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						await this.updateGatewayLog(response, metadataHeader, startRoundTrip);

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);
						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);

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
		if (this.config.providers.custom) {
			// Verify that the custom provider url is a valid URL
			return z
				.string()
				.trim()
				.url()
				.transform((url) => new URL(url))
				.parseAsync(this.config.providers.custom.url)
				.then((customProviderUrl) =>
					// Verify that the custom provider url is not an IP address
					z
						.string()
						.trim()
						.ip()
						.safeParseAsync(customProviderUrl.hostname)
						.then(async ({ success }) => {
							if (success) {
								throw new Error('IP custom providers not allowed');
							} else {
								// Run domain through ZT policies
								const doh = new DnsHelpers(new URL('dns-query', `https://${this.config.providers.custom?.dohId}.cloudflare-gateway.com`));

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
													'X-Executor': JSON.stringify(args.executor satisfies Exclude<AiRequestMetadata['executor'], string>),
													// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
													'X-Idempotency-Id': args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8.slice(0, 23) as AiRequestIdempotencyId),
													// Request to skip or custom cache duration (no guarantee that upstream server will respect it)
													// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
													...((args.skipCache || args.cache) && { 'Cache-Control': [args.skipCache && 'no-cache', args.cache && `max-age=${typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache}`].join(', ') }),
												},
												name: 'custom',
												fetch: async (input, rawInit) => {
													const headers = new Headers(rawInit?.headers);
													let idempotencyId = headers.get('X-Idempotency-Id')! as AiRequestMetadata['idempotencyId'];
													if (idempotencyId.split('-').length === 4) {
														idempotencyId = `${idempotencyId}-${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(0, 12)}` as AiRequestIdempotencyId;
														headers.set('X-Idempotency-Id', idempotencyId);
													}

													if (args.logging ?? this.config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(idempotencyId))(`[${idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

													return fetch(input, { ...rawInit, headers }).then(async (response) => {
														if (args.logging ?? this.config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(idempotencyId))(`[${idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

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
						}),
				)
				.catch(() => {
					throw new Error('Invalid custom provider url');
				});
		} else {
			// This always gets called, only throw error if actually being used
			return import('@ai-sdk/openai-compatible').then(async ({ createOpenAICompatible }) =>
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
				baseURL: new URL(['v1', this.config.gateway.accountId, this.config.environment, 'google-ai-studio', 'v1beta'].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
				apiKey: this.config.providers.googleAi.apiToken,
				headers: {
					'cf-aig-authorization': `Bearer ${this.config.gateway.apiToken}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
						executor: JSON.stringify(args.executor satisfies Exclude<AiRequestMetadata['executor'], string>),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8.slice(0, 23) as AiRequestIdempotencyId),
						serverInfo: JSON.stringify({
							name: 'googleai',
						} satisfies Exclude<AiRequestMetadata['serverInfo'], string>),
						/**
						 * Blank at first, add after request finishes
						 * CF AI Gateway allows only editing existing metadata not creating new ones after the request is made
						 */
						timing: JSON.stringify({}),
					} satisfies AiRequestMetadata),
					...(args.cache && { 'cf-aig-cache-ttl': (typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache).toString() }),
					...(args.skipCache && { 'cf-aig-skip-cache': 'true' }),
				},
				fetch: async (input, rawInit) => {
					const startRoundTrip = performance.now();

					const headers = new Headers(rawInit?.headers);
					const metadataHeader = JSON.parse(headers.get('cf-aig-metadata')!) as AiRequestMetadata;
					if (metadataHeader.idempotencyId.split('-').length === 4) {
						metadataHeader.idempotencyId = `${metadataHeader.idempotencyId}-${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(0, 12)}` as AiRequestIdempotencyId;
						headers.set('cf-aig-metadata', JSON.stringify(metadataHeader));
					}

					if (args.logging ?? this.config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return fetch(input, { ...rawInit, headers }).then(async (response) => {
						if (args.logging ?? this.config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						await this.updateGatewayLog(response, metadataHeader, startRoundTrip);

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);
						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);

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
				baseURL: new URL(['v1', this.config.gateway.accountId, this.config.environment, 'workers-ai', 'v1'].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
				apiKey: (this.config.providers.workersAi as AiConfigWorkersaiRest).apiToken,
				headers: {
					'cf-aig-authorization': `Bearer ${this.config.gateway.apiToken}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
						executor: JSON.stringify(args.executor satisfies Exclude<AiRequestMetadata['executor'], string>),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8.slice(0, 23) as AiRequestIdempotencyId),
						serverInfo: JSON.stringify({
							name: 'cloudflare',
						} satisfies Exclude<AiRequestMetadata['serverInfo'], string>),
						/**
						 * Blank at first, add after request finishes
						 * CF AI Gateway allows only editing existing metadata not creating new ones after the request is made
						 */
						timing: JSON.stringify({}),
					} satisfies AiRequestMetadata),
					...(args.cache && { 'cf-aig-cache-ttl': (typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache).toString() }),
					...(args.skipCache && { 'cf-aig-skip-cache': 'true' }),
				},
				name: 'workersai',
				fetch: async (input, rawInit) => {
					const startRoundTrip = performance.now();

					const headers = new Headers(rawInit?.headers);
					const metadataHeader = JSON.parse(headers.get('cf-aig-metadata')!) as AiRequestMetadata;
					if (metadataHeader.idempotencyId.split('-').length === 4) {
						metadataHeader.idempotencyId = `${metadataHeader.idempotencyId}-${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(0, 12)}` as AiRequestIdempotencyId;
						headers.set('cf-aig-metadata', JSON.stringify(metadataHeader));
					}

					if (args.logging ?? this.config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return fetch(input, { ...rawInit, headers }).then(async (response) => {
						if (args.logging ?? this.config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						await this.updateGatewayLog(response, metadataHeader, startRoundTrip);

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);
						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);

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
	/*public async bindingWorkersAi(args: AiRequestConfig) {
		return import('workers-ai-provider').then(({ createWorkersAI }) => createWorkersAI({ binding: this.config.providers.workersAi }));
	}*/
}
