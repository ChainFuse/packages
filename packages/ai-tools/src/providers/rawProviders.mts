import { BufferHelpers } from '@chainfuse/helpers/buffers';
import { Helpers } from '@chainfuse/helpers/common';
import { CryptoHelpers } from '@chainfuse/helpers/crypto';
import type { ReplaceHyphensWithUnderscores } from '@chainfuse/types';
import type { azureCatalog } from '@chainfuse/types/ai-tools/azure/catalog';
import type { cloudflareModelPossibilities } from '@chainfuse/types/ai-tools/workers-ai';
import type { AIGatewayUniversalRequest, GatewayOptions } from '@cloudflare/workers-types/experimental';
import type { APIPromise } from 'cloudflare/core';
import * as z from 'zod/mini';
import { AiBase } from '../base.mjs';
import type { AiConfigWorkersaiRest, AiRequestConfig, AiRequestMetadata, AiRequestMetadataStringified } from '../types.mjs';
import type { AzureOpenAIProvider } from './types.mts';

export class AiRawProviders extends AiBase {
	// 2628288 seconds is what cf defines as 1 month in their cache rules
	private readonly cacheTtl = 2628288;

	private static serverTimingHeader(metrics: Record<string, number>) {
		return Object.entries(metrics)
			.map(([name, duration]) => `${name};dur=${duration}`)
			.join(', ');
	}
	private async updateGatewayLog(response: Response, metadataHeader: AiRequestMetadataStringified, startRoundTrip: ReturnType<typeof performance.now>, logging: boolean, modelTime?: number) {
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
			const updateMetadata = (() => {
				if ('binding' in this.config.gateway) {
					return this.config.gateway.binding
						.gateway(this.gatewayName)
						.patchLog(logId, {
							metadata: {
								...Object.entries(rawMetadata).reduce((acc, [key, value]) => {
									acc[key as keyof AiRequestMetadata] = typeof value === 'string' ? value : JSON.stringify(value);
									return acc;
								}, {} as AiRequestMetadataStringified),
							},
						})
						.catch((error) => {
							if ('apiToken' in this.config.gateway) {
								return Promise.all([import('@chainfuse/helpers/common'), import('cloudflare'), import('@chainfuse/helpers/net').then(({ NetHelpers }) => NetHelpers.cfApi('apiToken' in this.config.gateway ? this.config.gateway.apiToken : '', { logging: { level: Number(logging) } }))]).then(([{ Helpers }, { APIError }, cf]) =>
									Helpers.tryWhile(
										() =>
											cf.aiGateway.logs.edit(this.gatewayName, logId, {
												account_id: this.config.gateway.accountId,
												metadata: {
													...Object.entries(rawMetadata).reduce((acc, [key, value]) => {
														acc[key as keyof AiRequestMetadata] = typeof value === 'string' ? value : JSON.stringify(value);
														return acc;
													}, {} as AiRequestMetadataStringified),
												} satisfies AiRequestMetadataStringified,
											}) as APIPromise<void>,
										(err, nextAttempt) => {
											if (err instanceof APIError) {
												// 7002 is code for Not Found
												const isRetryableError = err.errors.some(({ code }) => code === 7002);

												if (nextAttempt <= 3 && isRetryableError) {
													return true;
												}
											}
											return false;
										},
										{
											// `t=` from `Ratelimit` header
											baseDelayMs: 1 * 1000,
											// `w=` from `Ratelimit-Policy` header
											maxDelayMs: 300 * 1000,
										},
									).catch((error) => console.warn('Not updating gateway log', error)),
								);
							} else {
								console.warn('Not updating gateway log', error);
								return;
							}
						});
				} else {
					console.log(
						'metadata',
						JSON.stringify({
							metadata: {
								...Object.entries(rawMetadata).reduce((acc, [key, value]) => {
									acc[key as keyof AiRequestMetadata] = typeof value === 'string' ? value : JSON.stringify(value);
									return acc;
								}, {} as AiRequestMetadataStringified),
							},
						}),
					);

					return Promise.all([import('@chainfuse/helpers/common'), import('cloudflare'), import('@chainfuse/helpers/net').then(({ NetHelpers }) => NetHelpers.cfApi('apiToken' in this.config.gateway ? this.config.gateway.apiToken : '', { logging: { level: Number(logging) } }))]).then(([{ Helpers }, { APIError }, cf]) =>
						Helpers.tryWhile(
							() =>
								cf.aiGateway.logs.edit(this.gatewayName, logId, {
									account_id: this.config.gateway.accountId,
									metadata: {
										...Object.entries(rawMetadata).reduce((acc, [key, value]) => {
											acc[key as keyof AiRequestMetadata] = typeof value === 'string' ? value : JSON.stringify(value);
											return acc;
										}, {} as AiRequestMetadataStringified),
									} satisfies AiRequestMetadataStringified,
								}) as APIPromise<void>,
							(err, nextAttempt) => {
								if (err instanceof APIError) {
									// 7002 is code for Not Found
									const isRetryableError = err.errors.some(({ code }) => code === 7002);
									console.error('ooooga', nextAttempt <= 3, isRetryableError);

									if (nextAttempt <= Number.MAX_SAFE_INTEGER && isRetryableError) {
										return true;
									}
								}
								return false;
							},
							{
								// `t=` from `Ratelimit` header
								baseDelayMs: 1 * 1000,
								// `w=` from `Ratelimit-Policy` header
								maxDelayMs: 300 * 1000,
								verbose: true,
							},
						).catch((error) => console.warn('Not updating gateway log', error)),
					);
				}
			})();

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
					'cf-aig-authorization': `Bearer ${'apiToken' in this.config.gateway ? this.config.gateway.apiToken : ''}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
						...(args.groupBillingId && { groupBillingId: (await BufferHelpers.uuidConvert(args.groupBillingId)).utf8 }),
						serverInfo: JSON.stringify({
							name: 'openai',
						} satisfies AiRequestMetadata['serverInfo']),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid7()).utf8.slice(0, 23) as AiRequestMetadata['idempotencyId']),
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

					if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return (() => {
						if ('binding' in this.config.gateway) {
							const fallbackedHeaders: AIGatewayUniversalRequest['headers'] = {
								...Object.fromEntries(Array.from(headers.entries()).filter(([key]) => !key.toLowerCase().startsWith('cf-aig-'))),
								'cf-aig-metadata': JSON.stringify({
									...metadataHeader,
									serverInfo: JSON.stringify({
										name: 'openai',
									} satisfies AiRequestMetadata['serverInfo']),
								}),
							};

							// Prevent double stringification
							let fallbackedQuery: AIGatewayUniversalRequest['query'];
							try {
								fallbackedQuery = JSON.parse(rawInit?.body as string);
								// eslint-disable-next-line @typescript-eslint/no-unused-vars
							} catch (error) {
								fallbackedQuery = rawInit?.body;
							}

							return this.config.gateway.binding.gateway(this.gatewayName).run(
								{
									provider: 'openai',
									endpoint: new URL(new Request(input).url).pathname.split('/').slice(5).join('/'),
									headers: fallbackedHeaders,
									query: fallbackedQuery,
								},
								{
									extraHeaders: (() => {
										// Prevent duplicates
										headers.delete('cf-aig-authorization');
										headers.delete('cf-aig-metadata');
										headers.delete('cf-aig-cache-ttl');
										headers.delete('cf-aig-skip-cache');

										return headers;
									})(),
									gateway: {
										id: this.gatewayName,
										eventId: metadataHeader.idempotencyId,
										metadata: metadataHeader,
										...(args.cache && { cacheTtl: typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache }),
										...(args.skipCache && { skipCache: true }),
									},
								},
							);
						} else {
							return fetch(input, { ...rawInit, headers });
						}
					})().then(async (_response) => {
						const response = _response as Response;
						if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);

						const serverTiming = await this.updateGatewayLog(response, metadataHeader, startRoundTrip, args.logging ?? this.gatewayLog, response.headers.has('openai-processing-ms') ? parseInt(response.headers.get('openai-processing-ms')!) : undefined);

						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);
						mutableHeaders.set('Server-Timing', serverTiming);
						if (response.ok) {
							return new Response(response.body, { ...response, headers: mutableHeaders });
						} else {
							const [body1, body2] = response.body!.tee();

							console.error(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

							return new Response(body2, { ...response, headers: mutableHeaders });
						}
					});
				},
			}),
		);
	}

	public async azOpenai(args: AiRequestConfig) {
		const metadataHeader = {
			dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
			...(args.groupBillingId && { groupBillingId: (await BufferHelpers.uuidConvert(args.groupBillingId)).utf8 }),
			// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
			idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid7()).utf8.slice(0, 23) as AiRequestMetadata['idempotencyId']),
			executor: JSON.stringify(args.executor),
			// @ts-expect-error server info gets added in afterwards
		} satisfies AiRequestMetadataStringified;

		return import('@ai-sdk/azure').then(
			({ createAzure }) =>
				createAzure({
					apiKey: 'apikey-placeholder',
					/**
					 * @link https://learn.microsoft.com/en-us/azure/ai-foundry/openai/api-version-lifecycle?view=foundry-classic
					 * @link https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#api-specs
					 * From the table, pick the `Latest GA release` for `Data plane - inference`
					 */
					apiVersion: '2025-04-01-preview',
					useDeploymentBasedUrls: true,
					baseURL: new URL(['v1', this.config.gateway.accountId, this.gatewayName, 'azure-openai', 'server-placeholder'].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
					headers: {
						'cf-aig-authorization': `Bearer ${'apiToken' in this.config.gateway ? this.config.gateway.apiToken : ''}`,
						'cf-aig-metadata': JSON.stringify(metadataHeader),
						...(args.cache && { 'cf-aig-cache-ttl': (typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache).toString() }),
						...(args.skipCache && { 'cf-aig-skip-cache': 'true' }),
					},
					fetch: (input, rawInit) =>
						Promise.all([import('../serverSelector.mjs'), import('@chainfuse/types/ai-tools/azure/catalog')])
							.then(([{ ServerSelector }, { azureCatalog }]) => new ServerSelector(this.config).closestServers(azureCatalog))
							.then(async (closestServers) => {
								const startRoundTrip = performance.now();

								const headers = new Headers(rawInit?.headers);
								// Calculate the idempotencyId if it doesn't exist yet
								if (metadataHeader.idempotencyId.split('-').length === 4) {
									metadataHeader.idempotencyId = `${metadataHeader.idempotencyId}-${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(0, 12)}` as AiRequestMetadata['idempotencyId'];
									headers.set('cf-aig-metadata', JSON.stringify(metadataHeader));
								}

								// Get endpoint dynamically from library
								const fallbackedUrl = await import('@chainfuse/helpers').then(({ NetHelpers }) => (NetHelpers.isRequestLike(input) ? new URL(input.url) : new URL(input)));
								const fallbackedEndpointParts = (() => {
									const pathParts = fallbackedUrl.pathname
										.split('/')
										// removes empty from leading/trailing slashes
										.filter(Boolean);

									const index = pathParts.indexOf('azure-openai');
									return index === -1 ? [] : pathParts.slice(index + 2);
								})();

								// Prevent double stringification
								let fallbackedQuery: AIGatewayUniversalRequest['query'];
								try {
									fallbackedQuery = JSON.parse(rawInit?.body as string);
									// eslint-disable-next-line @typescript-eslint/no-unused-vars
								} catch (error) {
									fallbackedQuery = rawInit?.body;
								}

								const modelName = fallbackedEndpointParts[1]!;
								const filteredServers =
									// Check language models
									closestServers.filter(
										(server) =>
											server.languageModelAvailability.some((model) => model.name === modelName) ??
											// Check image models
											server.imageModelAvailability.some((model) => model.name === modelName) ??
											// Check embedding models
											server.textEmbeddingModelAvailability.some((model) => model.name === modelName),
									);

								// Build universal gateway request
								const fallbackedBody = await Promise.all([import('haversine-distance'), import('../serverSelector.mts')]).then(([{ default: haversine }, { ServerSelector }]) =>
									Promise.all(
										filteredServers.map(async (server) => {
											const fallbackedHeaders: AIGatewayUniversalRequest['headers'] = {
												...Object.fromEntries(Array.from(headers.entries()).filter(([key]) => !key.toLowerCase().startsWith('cf-aig-'))),
												'api-key': this.config.providers.azureOpenAi.apiTokens[`AZURE_API_KEY_${server.id.toUpperCase().replaceAll('-', '_') as Uppercase<ReplaceHyphensWithUnderscores<(typeof azureCatalog)[number]['id']>>}`]!,
												'cf-aig-metadata': JSON.stringify({
													...metadataHeader,
													serverInfo: JSON.stringify({
														name: `azure-${server.id}`,
														distance: haversine(
															await new ServerSelector(this.config).determineLocation().then(({ coordinate }) => ({
																lat: Helpers.precisionFloat(coordinate.lat),
																lon: Helpers.precisionFloat(coordinate.lon),
															})),
															{
																lat: Helpers.precisionFloat(server.coordinate.lat),
																lon: Helpers.precisionFloat(server.coordinate.lon),
															},
														),
													} satisfies AiRequestMetadata['serverInfo']),
												}),
											};

											const languageModel = server.languageModelAvailability.find((model) => model.name === modelName);
											if (languageModel && ('inputTokenCost' in languageModel || 'outputTokenCost' in languageModel)) {
												fallbackedHeaders['cf-aig-custom-cost'] = {
													per_token_in: 'inputTokenCost' in languageModel && !isNaN(languageModel.inputTokenCost as number) ? (languageModel.inputTokenCost as number) : undefined,
													per_token_out: 'outputTokenCost' in languageModel && !isNaN(languageModel.outputTokenCost as number) ? (languageModel.outputTokenCost as number) : undefined,
												};
											}
											const embeddingModel = server.textEmbeddingModelAvailability.find((model) => model.name === modelName);
											if (embeddingModel && 'tokenCost' in embeddingModel) {
												fallbackedHeaders['cf-aig-custom-cost'] = {
													per_token_in: 'tokenCost' in embeddingModel && !isNaN(embeddingModel.tokenCost as number) ? (embeddingModel.tokenCost as number) : undefined,
												};
											}

											return {
												provider: 'azure-openai',
												endpoint: `${[server.id.toLowerCase(), ...fallbackedEndpointParts].join('/')}${fallbackedUrl.search}${fallbackedUrl.hash}`,
												headers: fallbackedHeaders,
												query: fallbackedQuery,
											} as AIGatewayUniversalRequest;
										}),
									),
								);

								if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

								return (() => {
									if ('binding' in this.config.gateway && typeof this.config.gateway.binding?.gateway === 'function') {
										return this.config.gateway.binding.gateway(this.gatewayName).run(fallbackedBody, {
											extraHeaders: (() => {
												// Prevent duplicates
												headers.delete('cf-aig-authorization');
												headers.delete('cf-aig-metadata');
												headers.delete('cf-aig-cache-ttl');
												headers.delete('cf-aig-skip-cache');

												return headers;
											})(),
											gateway: {
												id: this.gatewayName,
												eventId: metadataHeader.idempotencyId,
												metadata: metadataHeader,
												...(args.cache && { cacheTtl: typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache }),
												...(args.skipCache && { skipCache: true }),
											},
										});
									} else {
										return fetch(new URL(['v1', this.config.gateway.accountId, this.gatewayName].join('/'), 'https://gateway.ai.cloudflare.com'), { ...rawInit, headers, body: JSON.stringify(fallbackedBody) });
									}
								})().then(async (_response) => {
									const response = _response as Response;
									// Inject it to have it available for retries
									const mutableHeaders = new Headers(response.headers);
									// Carry down
									mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);

									// Step references which server it hit
									const fallbackedServerRaw = response.headers.get('cf-aig-step');
									if (fallbackedServerRaw) {
										const fallbackedRequest = fallbackedBody[parseInt(fallbackedServerRaw)];

										if (fallbackedRequest) {
											// Get the server's specific metadata
											const fallbackedMetadataHeader = JSON.parse(new Headers(fallbackedRequest.headers as HeadersInit).get('cf-aig-metadata')!) as AiRequestMetadataStringified;

											if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname), response.ok ? this.chalk.green(`[${fallbackedRequest.endpoint.split('/')[0]}]`) : this.chalk.red(`[${fallbackedRequest.endpoint.split('/')[0]}]`));

											const serverTiming = await this.updateGatewayLog(response, fallbackedMetadataHeader, startRoundTrip, args.logging ?? this.gatewayLog, response.headers.has('x-envoy-upstream-service-time') ? parseInt(response.headers.get('x-envoy-upstream-service-time')!) : undefined);

											mutableHeaders.set('Server-Timing', serverTiming);
										} else {
											// Log without picked server
											if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));
										}
									} else {
										// Log without picked server
										if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));
									}

									if (response.ok) {
										return new Response(response.body, { ...response, headers: mutableHeaders });
									} else {
										const [body1, body2] = response.body!.tee();

										console.error(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

										return new Response(body2, { ...response, headers: mutableHeaders });
									}
								});
							}),
				}) as AzureOpenAIProvider,
		);
	}

	public anthropic(args: AiRequestConfig) {
		return import('@ai-sdk/anthropic').then(async ({ createAnthropic }) =>
			createAnthropic({
				baseURL: new URL(['v1', this.config.gateway.accountId, this.gatewayName, 'anthropic'].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
				apiKey: this.config.providers.anthropic.apiToken,
				headers: {
					'cf-aig-authorization': `Bearer ${'apiToken' in this.config.gateway ? this.config.gateway.apiToken : ''}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
						...(args.groupBillingId && { groupBillingId: (await BufferHelpers.uuidConvert(args.groupBillingId)).utf8 }),
						serverInfo: JSON.stringify({
							name: 'anthropic',
						} satisfies AiRequestMetadata['serverInfo']),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid7()).utf8.slice(0, 23) as AiRequestMetadata['idempotencyId']),
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

					if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return (() => {
						if ('binding' in this.config.gateway) {
							const fallbackedHeaders: AIGatewayUniversalRequest['headers'] = {
								...Object.fromEntries(Array.from(headers.entries()).filter(([key]) => !key.toLowerCase().startsWith('cf-aig-'))),
								'cf-aig-metadata': JSON.stringify({
									...metadataHeader,
									serverInfo: JSON.stringify({
										name: 'anthropic',
									} satisfies AiRequestMetadata['serverInfo']),
								}),
							};

							// Prevent double stringification
							let fallbackedQuery: AIGatewayUniversalRequest['query'];
							try {
								fallbackedQuery = JSON.parse(rawInit?.body as string);
								// eslint-disable-next-line @typescript-eslint/no-unused-vars
							} catch (error) {
								fallbackedQuery = rawInit?.body;
							}

							return this.config.gateway.binding.gateway(this.gatewayName).run(
								{
									provider: 'anthropic',
									endpoint: new URL(new Request(input).url).pathname.split('/').slice(5).join('/'),
									headers: fallbackedHeaders,
									query: fallbackedQuery,
								},
								{
									extraHeaders: (() => {
										// Prevent duplicates
										headers.delete('cf-aig-authorization');
										headers.delete('cf-aig-metadata');
										headers.delete('cf-aig-cache-ttl');
										headers.delete('cf-aig-skip-cache');

										return headers;
									})(),
									gateway: {
										id: this.gatewayName,
										eventId: metadataHeader.idempotencyId,
										metadata: metadataHeader,
										...(args.cache && { cacheTtl: typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache }),
										...(args.skipCache && { skipCache: true }),
									},
								},
							);
						} else {
							return fetch(input, { ...rawInit, headers });
						}
					})().then(async (_response) => {
						const response = _response as Response;
						if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);

						const serverTiming = await this.updateGatewayLog(response, metadataHeader, startRoundTrip, args.logging ?? this.gatewayLog);

						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);
						mutableHeaders.set('Server-Timing', serverTiming);
						if (response.ok) {
							return new Response(response.body, { ...response, headers: mutableHeaders });
						} else {
							const [body1, body2] = response.body!.tee();

							console.error(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

							return new Response(body2, { ...response, headers: mutableHeaders });
						}
					});
				},
			}),
		);
	}

	public custom(args: AiRequestConfig) {
		if (this.config.providers.custom?.url) {
			// Verify that the custom provider url is a valid URL
			return z
				.pipe(
					z.url().check(z.trim()),
					z.transform((url) => new URL(url)),
				)
				.parseAsync(this.config.providers.custom.url)
				.then((customProviderUrl) =>
					// Verify that the custom provider url is not an IP address
					z
						.union([z.ipv4().check(z.trim()), z.ipv6().check(z.trim())])
						.safeParseAsync(customProviderUrl.hostname)
						.then(({ success }) => ({ customProviderUrl, success })),
				)
				.then(async ({ customProviderUrl, success }) => {
					if (success) {
						throw new Error('IP custom providers not allowed');
					} else {
						// Run domain through ZT policies
						const { aCheck, aaaaCheck } = await import('@chainfuse/helpers/dns').then(({ DnsHelpers, DNSRecordType }) => {
							const doh = new DnsHelpers({ nameservers: [`https://${this.config.providers.custom?.dohId}.cloudflare-gateway.com/dns-query`] }, undefined, this.config.backgroundContext);

							return {
								aCheck: doh.query({ questions: [{ hostname: customProviderUrl.hostname, recordType: DNSRecordType['A (IPv4 Address)'] }], timeout: 2 * 1000 }),
								aaaaCheck: doh.query({ questions: [{ hostname: customProviderUrl.hostname, recordType: DNSRecordType['AAAA (IPv6 Address)'] }], timeout: 2 * 1000 }),
							};
						});

						return Promise.allSettled([aCheck, aaaaCheck]).then((checks) => {
							const fulfulledChecks = checks.filter((check) => check.status === 'fulfilled');

							/**
							 * Blocked domains return 0.0.0.0 or :: as the answer
							 * @link https://developers.cloudflare.com/cloudflare-one/policies/gateway/block-page/
							 */
							if (fulfulledChecks.length > 0 && fulfulledChecks.some((obj) => 'answers' in obj.value && Array.isArray(obj.value.answers) && obj.value.answers.some((answer) => 'data' in answer && answer.data !== '0.0.0.0' && answer.data !== '::'))) {
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
											'X-Idempotency-Id': args.idempotencyId ?? ((await BufferHelpers.generateUuid7()).utf8.slice(0, 23) as AiRequestMetadata['idempotencyId']),
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

											if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(idempotencyId))(`[${idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

											return fetch(input, { ...rawInit, headers }).then(async (response) => {
												if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(idempotencyId))(`[${idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

												// Inject it to have it available for retries
												const mutableHeaders = new Headers(response.headers);
												mutableHeaders.set('X-Idempotency-Id', idempotencyId);

												if (response.ok) {
													return new Response(response.body, { ...response, headers: mutableHeaders });
												} else {
													const [body1, body2] = response.body!.tee();

													console.error(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(idempotencyId))(`[${idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

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
					'cf-aig-authorization': `Bearer ${'apiToken' in this.config.gateway ? this.config.gateway.apiToken : ''}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
						...(args.groupBillingId && { groupBillingId: (await BufferHelpers.uuidConvert(args.groupBillingId)).utf8 }),
						serverInfo: JSON.stringify({
							name: 'googleai',
						} satisfies AiRequestMetadata['serverInfo']),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid7()).utf8.slice(0, 23) as AiRequestMetadata['idempotencyId']),
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

					if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return (() => {
						if ('binding' in this.config.gateway) {
							const fallbackedHeaders: AIGatewayUniversalRequest['headers'] = {
								...Object.fromEntries(Array.from(headers.entries()).filter(([key]) => !key.toLowerCase().startsWith('cf-aig-'))),
								'cf-aig-metadata': JSON.stringify({
									...metadataHeader,
									serverInfo: JSON.stringify({
										name: 'googleai',
									} satisfies AiRequestMetadata['serverInfo']),
								}),
							};

							// Prevent double stringification
							let fallbackedQuery: AIGatewayUniversalRequest['query'];
							try {
								fallbackedQuery = JSON.parse(rawInit?.body as string);
								// eslint-disable-next-line @typescript-eslint/no-unused-vars
							} catch (error) {
								fallbackedQuery = rawInit?.body;
							}

							return this.config.gateway.binding.gateway(this.gatewayName).run(
								{
									provider: 'google-ai-studio',
									endpoint: new URL(new Request(input).url).pathname.split('/').slice(5).join('/'),
									headers: fallbackedHeaders,
									query: fallbackedQuery,
								},
								{
									extraHeaders: (() => {
										// Prevent duplicates
										headers.delete('cf-aig-authorization');
										headers.delete('cf-aig-metadata');
										headers.delete('cf-aig-cache-ttl');
										headers.delete('cf-aig-skip-cache');

										return headers;
									})(),
									gateway: {
										id: this.gatewayName,
										eventId: metadataHeader.idempotencyId,
										metadata: metadataHeader,
										...(args.cache && { cacheTtl: typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache }),
										...(args.skipCache && { skipCache: true }),
									},
								},
							);
						} else {
							return fetch(input, { ...rawInit, headers });
						}
					})().then(async (_response) => {
						const response = _response as Response;
						if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);

						const serverTiming = await this.updateGatewayLog(response, metadataHeader, startRoundTrip, args.logging ?? this.gatewayLog);

						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);
						mutableHeaders.set('Server-Timing', serverTiming);
						if (response.ok) {
							return new Response(response.body, { ...response, headers: mutableHeaders });
						} else {
							const [body1, body2] = response.body!.tee();

							console.error(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

							return new Response(body2, { ...response, headers: mutableHeaders });
						}
					});
				},
			}),
		);
	}

	public restWorkersAi(args: AiRequestConfig) {
		return import('@ai-sdk/openai-compatible').then(async ({ createOpenAICompatible }) =>
			createOpenAICompatible<cloudflareModelPossibilities<'Text Generation'>, cloudflareModelPossibilities<'Text Generation'>, cloudflareModelPossibilities<'Text Embeddings'>, cloudflareModelPossibilities<'Text-to-Image'>>({
				baseURL: new URL(['v1', this.config.gateway.accountId, this.gatewayName, 'workers-ai', 'v1'].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
				apiKey: (this.config.providers.workersAi as AiConfigWorkersaiRest).apiToken,
				headers: {
					'cf-aig-authorization': `Bearer ${'apiToken' in this.config.gateway ? this.config.gateway.apiToken : ''}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: (await BufferHelpers.uuidConvert(args.dataspaceId)).utf8,
						...(args.groupBillingId && { groupBillingId: (await BufferHelpers.uuidConvert(args.groupBillingId)).utf8 }),
						serverInfo: JSON.stringify({
							name: 'cloudflare',
						} satisfies AiRequestMetadata['serverInfo']),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid7()).utf8.slice(0, 23) as AiRequestMetadata['idempotencyId']),
						executor: JSON.stringify(args.executor),
					} satisfies AiRequestMetadataStringified),
					...(args.cache && { 'cf-aig-cache-ttl': (typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache).toString() }),
					...(args.skipCache && { 'cf-aig-skip-cache': 'true' }),
				},
				includeUsage: true,
				supportsStructuredOutputs: true,
				name: 'workersai',
				fetch: async (input, rawInit) => {
					const startRoundTrip = performance.now();

					const headers = new Headers(rawInit?.headers);
					const metadataHeader = JSON.parse(headers.get('cf-aig-metadata')!) as AiRequestMetadataStringified;
					if (metadataHeader.idempotencyId.split('-').length === 4) {
						metadataHeader.idempotencyId = `${metadataHeader.idempotencyId}-${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(0, 12)}` as AiRequestMetadata['idempotencyId'];
						headers.set('cf-aig-metadata', JSON.stringify(metadataHeader));
					}

					if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return (() => {
						if ('binding' in this.config.gateway) {
							const fallbackedHeaders: AIGatewayUniversalRequest['headers'] = {
								...Object.fromEntries(Array.from(headers.entries()).filter(([key]) => !key.toLowerCase().startsWith('cf-aig-'))),
								'cf-aig-metadata': JSON.stringify({
									...metadataHeader,
									serverInfo: JSON.stringify({
										name: 'cloudflare',
									} satisfies AiRequestMetadata['serverInfo']),
								}),
							};

							// Prevent double stringification
							let fallbackedQuery: AIGatewayUniversalRequest['query'];
							try {
								fallbackedQuery = JSON.parse(rawInit?.body as string);
								// eslint-disable-next-line @typescript-eslint/no-unused-vars
							} catch (error) {
								fallbackedQuery = rawInit?.body;
							}

							return this.config.gateway.binding.gateway(this.gatewayName).run(
								{
									provider: 'workers-ai',
									endpoint: new URL(new Request(input).url).pathname.split('/').slice(5).join('/'),
									headers: fallbackedHeaders,
									query: fallbackedQuery,
								},
								{
									extraHeaders: (() => {
										// Prevent duplicates
										headers.delete('cf-aig-authorization');
										headers.delete('cf-aig-metadata');
										headers.delete('cf-aig-cache-ttl');
										headers.delete('cf-aig-skip-cache');

										return headers;
									})(),
									gateway: {
										id: this.gatewayName,
										eventId: metadataHeader.idempotencyId,
										metadata: metadataHeader,
										...(args.cache && { cacheTtl: typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache }),
										...(args.skipCache && { skipCache: true }),
									},
								},
							);
						} else {
							return fetch(input, { ...rawInit, headers });
						}
					})().then(async (_response) => {
						const response = _response as Response;
						if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);

						if (headers.get('cf-ray')) {
							metadataHeader.serverInfo = JSON.stringify({
								name: `cloudflare-${mutableHeaders.get('cf-ray')?.split('-')[1]}`,
							} satisfies AiRequestMetadata['serverInfo']);
						}
						const serverTiming = await this.updateGatewayLog(response, metadataHeader, startRoundTrip, args.logging ?? this.gatewayLog);

						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);
						mutableHeaders.set('Server-Timing', serverTiming);

						if (response.ok) {
							return new Response(response.body, { ...response, headers: mutableHeaders });
						} else {
							const [body1, body2] = response.body!.tee();

							console.error(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

							return new Response(body2, { ...response, headers: mutableHeaders });
						}
					});
				},
			}),
		);
	}

	public bindingWorkersAi(args: AiRequestConfig) {
		return import('workers-ai-provider').then(async ({ createWorkersAI }) => {
			const idempotencyId = args.idempotencyId ?? (await BufferHelpers.generateUuid7()).utf8;

			if (args.logging ?? this.gatewayLog) console.info(new Date().toISOString(), this.chalk.rgb(...Helpers.uniqueIdColor(idempotencyId))(`[${idempotencyId}]`), this.chalk.magenta('POST'), this.chalk.magenta('apiToken' in this.config.providers.workersAi ? new URL(`https://gateway.ai.cloudflare.com/v1/${this.config.gateway.accountId}/${this.gatewayName}/workers-ai/model-placeholder`).pathname : 'Ai.run(model-placeholder)'));

			return createWorkersAI({
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
						idempotencyId,
						executor: JSON.stringify(args.executor),
					} satisfies AiRequestMetadataStringified,
				} satisfies GatewayOptions,
			});
		});
	}
}
