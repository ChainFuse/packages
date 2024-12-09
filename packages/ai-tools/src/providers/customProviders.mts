import { Helpers } from '@chainfuse/helpers';
import { enabledCloudflareLlmEmbeddingProviders, enabledCloudflareLlmProviders, type AzureChatModels, type AzureEmbeddingModels, type cloudflareModelPossibilities } from '@chainfuse/types';
import { APICallError, experimental_customProvider as customProvider, experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { AiBase } from '../base.mjs';
import { AzureServerSelector } from '../serverSelector/azure.mjs';
import type { AiConfigWorkersaiRest, AiRequestConfig, AiRequestIdempotencyId } from '../types.mjs';
import { AiRawProviders } from './rawProviders.mjs';
import type { AzureOpenAIProvider, CloudflareOpenAIProvider } from './types.mjs';

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
						model: (await raw.azOpenai(args, server!.id))(model),
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
												return await (await raw.azOpenai({ ...args, idempotencyId }, nextServer.id))(model.modelId).doGenerate(params);
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
					acc[model as AzureEmbeddingModels] = (await raw.azOpenai(args, server!.id)).textEmbeddingModel(model);
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

	private static workersAiIsRest(arg: any): arg is AiConfigWorkersaiRest {
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
						// @ts-expect-error override for types
						acc[model] = (await raw.restWorkersAi(args))(model);
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
			}) as CloudflareOpenAIProvider;
		} else {
			return customProvider({
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
				// @ts-expect-error override for types
				textEmbeddingModels: await enabledCloudflareLlmEmbeddingProviders.reduce(
					async (accPromise, model) => {
						const acc = await accPromise;
						// @ts-expect-error override for types
						acc[model] = (await raw.bindingWorkersAi(args)).textEmbeddingModel(model);
						return acc;
					},
					Promise.resolve({} as Record<cloudflareModelPossibilities<'Text Embeddings'>, Awaited<ReturnType<AiRawProviders['bindingWorkersAi']>>>),
				),
			}) as CloudflareOpenAIProvider;
		}
	}
}
