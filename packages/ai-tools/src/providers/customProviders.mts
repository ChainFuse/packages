import type { GoogleGenerativeAIProvider } from '@ai-sdk/google';
import type { OpenAICompatibleProvider } from '@ai-sdk/openai-compatible';
import { Helpers } from '@chainfuse/helpers';
import { AiModels, enabledCloudflareLlmEmbeddingProviders, enabledCloudflareLlmProviders, type AzureChatModels, type AzureEmbeddingModels, type cloudflareModelPossibilities } from '@chainfuse/types';
import { APICallError, experimental_customProvider as customProvider, TypeValidationError, experimental_wrapLanguageModel as wrapLanguageModel, type LanguageModelV1StreamPart } from 'ai';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import { ZodError } from 'zod';
import { AiBase } from '../base.mjs';
import { AzureServerSelector } from '../serverSelector/azure.mjs';
import type { AiConfigWorkersai, AiConfigWorkersaiRest, AiRequestConfig, AiRequestIdempotencyId } from '../types.mjs';
import { AiRawProviders } from './rawProviders.mjs';
import type { AzureOpenAIProvider } from './types.mjs';

export class AiCustomProviders extends AiBase {
	public oaiOpenai(args: AiRequestConfig) {
		return new AiRawProviders(this.config).oaiOpenai(args);
	}

	public async azOpenai(args: AiRequestConfig, [server, ...servers] = new AzureServerSelector(this.config).closestServers()): Promise<AzureOpenAIProvider> {
		const raw = new AiRawProviders(this.config);

		return customProvider({
			// @ts-expect-error override for types
			languageModels: await server!.languageModelAvailability.reduce(
				async (accPromise, model) => {
					const acc = await accPromise;
					// @ts-expect-error override for types
					acc[model as AzureChatModels] = wrapLanguageModel({
						model: (await raw.azOpenai(args, server!))(model),
						middleware: {
							wrapGenerate: async ({ doGenerate, model, params }) => {
								try {
									// Must be double awaited to prevent a promise from being returned
									return await doGenerate();
								} catch (error) {
									if (APICallError.isInstance(error)) {
										const idempotencyId = new Headers(error.responseHeaders).get('X-Idempotency-Id') as AiRequestIdempotencyId;
										const lastServer = new URL(error.url).pathname.split('/')[5]!;
										const compatibleServers = new AzureServerSelector(this.config).closestServers(model.modelId);
										const lastServerIndex = compatibleServers.findIndex((s) => s.id.toLowerCase() === lastServer.toLowerCase());

										if (args.logging ?? this.config.environment !== 'production') console.error('ai', 'custom provider', this.chalk.rgb(...Helpers.uniqueIdColor(idempotencyId))(`[${idempotencyId}]`), this.chalk.red('FAIL'), compatibleServers[lastServerIndex]!.id, 'REMAINING', JSON.stringify(compatibleServers.slice(lastServerIndex + 1).map((s) => s.id)));

										// Should retry with the next server
										const leftOverServers = compatibleServers.slice(lastServerIndex + 1);
										const errors: unknown[] = [error];

										for (const nextServer of leftOverServers) {
											try {
												if (args.logging ?? this.config.environment !== 'production') console.error('ai', 'custom provider', this.chalk.rgb(...Helpers.uniqueIdColor(idempotencyId))(`[${idempotencyId}]`), this.chalk.blue('FALLBACK'), nextServer.id, 'REMAINING', JSON.stringify(leftOverServers.slice(leftOverServers.indexOf(nextServer) + 1).map((s) => s.id)));

												// Must be double awaited to prevent a promise from being returned
												return await (await raw.azOpenai({ ...args, idempotencyId }, nextServer))(model.modelId).doGenerate(params);
											} catch (nextServerError) {
												if (APICallError.isInstance(nextServerError)) {
													if (args.logging ?? this.config.environment !== 'production') console.error('ai', 'custom provider', this.chalk.rgb(...Helpers.uniqueIdColor(idempotencyId))(`[${idempotencyId}]`), this.chalk.red('FAIL'), nextServer.id, 'REMAINING', JSON.stringify(leftOverServers.slice(leftOverServers.indexOf(nextServer) + 1).map((s) => s.id)));

													errors.push(nextServerError);
												} else {
													errors.push(nextServerError);
													throw nextServerError;
												}
											}
										}

										// eslint-disable-next-line @typescript-eslint/only-throw-error
										throw errors;
									} else {
										throw error;
									}
								}
							},
						},
					});
					return acc;
				},
				Promise.resolve({} as Record<AzureChatModels, Awaited<ReturnType<AiRawProviders['azOpenai']>>>),
			),
			// @ts-expect-error override for types
			textEmbeddingModels: await server!.textEmbeddingModelAvailability.reduce(
				async (accPromise, model) => {
					const acc = await accPromise;
					// @ts-expect-error override for types
					acc[model as AzureEmbeddingModels] = (await raw.azOpenai(args, server!)).textEmbeddingModel(model);
					return acc;
				},
				Promise.resolve({} as Record<AzureEmbeddingModels, Awaited<ReturnType<AiRawProviders['azOpenai']>>>),
			),
			// An optional fallback provider to use when a requested model is not found in the custom provider.
			...(servers.length > 0 && { fallbackProvider: await this.azOpenai(args, servers) }),
		}) as AzureOpenAIProvider; // Override type so autocomplete works
	}

	public anthropic(args: AiRequestConfig) {
		return new AiRawProviders(this.config).anthropic(args);
	}

	private static workersAiIsRest(arg: AiConfigWorkersai): arg is AiConfigWorkersaiRest {
		return typeof arg === 'object' && 'apiToken' in arg;
	}
	public async cfWorkersAi(args: AiRequestConfig) {
		const raw = new AiRawProviders(this.config);

		if (AiCustomProviders.workersAiIsRest(this.config.providers.workersAi)) {
			return customProvider({
				// @ts-expect-error override for types
				languageModels: await enabledCloudflareLlmProviders.reduce(
					async (accPromise, model) => {
						const acc = await accPromise;
						/**
						 * Intercept and add in missing index property to be OpenAI compatible
						 */
						// @ts-expect-error override for types
						acc[model] = wrapLanguageModel({
							model: (await raw.restWorkersAi(args))(model),
							middleware: {
								wrapStream: async ({ doStream }) => {
									const { stream, ...rest } = await doStream();

									const transformStream = new TransformStream<LanguageModelV1StreamPart, LanguageModelV1StreamPart>({
										transform(chunk, controller) {
											if (chunk.type === 'error') {
												if (TypeValidationError.isInstance(chunk.error) && chunk.error.cause instanceof ZodError) {
													if (chunk.error.cause.issues.filter((issues) => issues.code === 'invalid_union')) {
														// Verify the specific error instead of assuming all errors
														const missingIndexPropertyError = chunk.error.cause.issues
															.filter((issues) => issues.code === 'invalid_union')
															.flatMap((issue) => issue.unionErrors)
															.flatMap((issue) => issue.issues)
															.filter((issue) => issue.code === 'invalid_type' && Helpers.areArraysEqual(issue.path, ['choices', 0, 'index']));

														if (missingIndexPropertyError.length > 0) {
															const newChunk = chunk.error.value as ChatCompletionChunk;

															newChunk.choices
																.filter((choice) => choice.delta.content)
																.forEach((choice) => {
																	controller.enqueue({
																		type: 'text-delta',
																		textDelta: choice.delta.content!,
																	});
																});
														}
													}
												}
											} else {
												// Passthrough untouched
												controller.enqueue(chunk);
											}
										},
									});

									return {
										stream: stream.pipeThrough(transformStream),
										...rest,
									};
								},
							},
						});
						return acc;
					},
					Promise.resolve({} as Record<cloudflareModelPossibilities<'Text Generation'>, Awaited<ReturnType<AiRawProviders['restWorkersAi']>>>),
				),
				// @ts-expect-error override for types
				textEmbeddingModels: await enabledCloudflareLlmEmbeddingProviders.reduce(
					async (accPromise, model) => {
						const acc = await accPromise;
						// @ts-expect-error override for types
						acc[model] = (await raw.restWorkersAi(args)).textEmbeddingModel(model);
						return acc;
					},
					Promise.resolve({} as Record<cloudflareModelPossibilities<'Text Embeddings'>, Awaited<ReturnType<AiRawProviders['restWorkersAi']>>>),
				),
			}) as OpenAICompatibleProvider<cloudflareModelPossibilities<'Text Generation'>, cloudflareModelPossibilities<'Text Generation'>, cloudflareModelPossibilities<'Text Embeddings'>>;
		} else {
			throw new Error('Binding workers AI is not supported');

			/*return customProvider({
				// @ts-expect-error override for types
				languageModels: await enabledCloudflareLlmProviders.reduce(
					async (accPromise, model) => {
						const acc = await accPromise;
						// @ts-expect-error override for types
						acc[model] = (await raw.bindingWorkersAi(args))(model);
						return acc;
					},
					Promise.resolve({} as Record<cloudflareModelPossibilities<'Text Generation'>, Awaited<ReturnType<AiRawProviders['bindingWorkersAi']>>>),
				),
			}) as CloudflareOpenAIProvider;*/
		}
	}

	public async googleAi(args: AiRequestConfig): Promise<GoogleGenerativeAIProvider> {
		const fallbackProvider = await new AiRawProviders(this.config).googleAi(args);

		return customProvider({
			languageModels: {
				// provider:actual model name:extra
				[AiModels.LanguageModels.GoogleGenerativeAi.gemini_flash_beta_search.split(':').slice(1).join(':')]: fallbackProvider(AiModels.LanguageModels.GoogleGenerativeAi.gemini_flash_beta_search.split(':')[1] as Parameters<typeof fallbackProvider>[0], { useSearchGrounding: true }),
				[AiModels.LanguageModels.GoogleGenerativeAi.gemini_flash_search.split(':').slice(1).join(':')]: fallbackProvider(AiModels.LanguageModels.GoogleGenerativeAi.gemini_flash_search.split(':')[1] as Parameters<typeof fallbackProvider>[0], { useSearchGrounding: true }),
				[AiModels.LanguageModels.GoogleGenerativeAi.gemini_pro_search.split(':').slice(1).join(':')]: fallbackProvider(AiModels.LanguageModels.GoogleGenerativeAi.gemini_pro_search.split(':')[1] as Parameters<typeof fallbackProvider>[0], { useSearchGrounding: true }),
			},
			fallbackProvider,
			// GoogleGenerativeAi
		}) as GoogleGenerativeAIProvider;
	}
}
