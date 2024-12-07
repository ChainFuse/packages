import type { AzureChatModels, AzureEmbeddingModels } from '@chainfuse/types';
import { experimental_customProvider as customProvider } from 'ai';
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
					acc[model as AzureChatModels] = (await raw.azOpenai(args, server!.id))(model);
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
			...(servers.length > 0 && { fallbackProvider: await this.azOpenai(args, servers) }),
		}) as AzureOpenAIProvider; // Override type so autocomplete works
	}
}
