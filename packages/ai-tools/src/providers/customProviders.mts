import type { AzureChatModels, AzureEmbeddingModels } from '@chainfuse/types';
import { APICallError, experimental_customProvider as customProvider, experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { AiBase } from '../base.mjs';
import { AzureServerSelector } from '../serverSelector/azure.mjs';
import type { AiRequestConfig } from '../types.mjs';
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
						model: (await raw.azOpenai(args, server!.id))(model),
						middleware: {
							wrapGenerate: async ({ doGenerate, params }) => {
								try {
									const result = await doGenerate();

									return result;
								} catch (error) {
									if (APICallError.isInstance(error)) {
										const urlFragments = new URL(error.url).pathname.split('/');
										const lastServer = urlFragments[5]!;
										const modelName = urlFragments[6]!;
										const compatibleServers = new AzureServerSelector(this.config).closestServers(modelName);
										const lastServerIndex = compatibleServers.findIndex((s) => s.id.toLowerCase() === lastServer.toLowerCase());

										// Safety check if next servers exist
										if (lastServerIndex < compatibleServers.length - 1) {
											console.error(lastServer, compatibleServers.slice(lastServerIndex + 1));
											// Should retry with the next server
										} else {
											throw error;
										}

										throw error;
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
					acc[model as AzureEmbeddingModels] = (await raw.azOpenai(args, server!.id))(model);
					return acc;
				},
				Promise.resolve({} as Record<AzureEmbeddingModels, Awaited<ReturnType<AiRawProviders['azOpenai']>>>),
			),
			// An optional fallback provider to use when a requested model is not found in the custom provider.
			...(servers.length > 0 && { fallbackProvider: await this.azOpenai(args, servers) }),
		}) as AzureOpenAIProvider; // Override type so autocomplete works
	}
}
