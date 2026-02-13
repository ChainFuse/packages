import type { OpenAICompatibleProvider } from '@ai-sdk/openai-compatible';
import type { cloudflareModelPossibilities } from '@chainfuse/types/ai-tools/workers-ai';
import { AiBase } from '../base.mjs';
import type { AiRequestConfig } from '../types.mjs';
import { AiRawProviders } from './rawProviders.mjs';

export class AiCustomProviders extends AiBase {
	public oaiOpenai(args: AiRequestConfig) {
		return new AiRawProviders(this.config).oaiOpenai(args);
	}

	public async azOpenai(args: AiRequestConfig) {
		return new AiRawProviders(this.config).azOpenai(args);
	}

	public anthropic(args: AiRequestConfig) {
		return new AiRawProviders(this.config).anthropic(args);
	}

	public async workersAi(args: AiRequestConfig) {
		const fallbackProvider = await new AiRawProviders(this.config).workersAi(args);
		type openAiCompatType = OpenAICompatibleProvider<cloudflareModelPossibilities<'Text Generation'>, cloudflareModelPossibilities<'Text Generation'>, cloudflareModelPossibilities<'Text Embeddings'>, cloudflareModelPossibilities<'Text-to-Image'>>;

		return Promise.all([import('ai'), import('@chainfuse/types/ai-tools/workers-ai')]).then(
			async ([{ customProvider }, { enabledCloudflareLlmEmbeddingProviders, enabledCloudflareLlmProviders }]) =>
				customProvider({
					// Workers AI exposes it as `textEmbedding` but ai sdk expects `embeddingModel`
					embeddingModels: await enabledCloudflareLlmEmbeddingProviders.reduce(
						async (accPromise, model) => {
							const acc = await accPromise;
							/**
							 * Intercept and add in missing index property to be OpenAI compatible
							 */
							acc[model] = fallbackProvider.textEmbedding(model);
							return acc;
						},
						Promise.resolve({} as Record<cloudflareModelPossibilities<'Text Embeddings'>, ReturnType<(typeof fallbackProvider)['textEmbedding']>>),
					),
					// Workers AI exposes it as `chat` but ai sdk expects `languageModel`
					languageModels: await enabledCloudflareLlmProviders.reduce(
						async (accPromise, model) => {
							const acc = await accPromise;
							/**
							 * Intercept and add in missing index property to be OpenAI compatible
							 */
							acc[model] = fallbackProvider.chat(model);
							return acc;
						},
						Promise.resolve({} as Record<cloudflareModelPossibilities<'Text Generation'>, ReturnType<(typeof fallbackProvider)['chat']>>),
					),
					// The rest are compatible as is
					fallbackProvider: fallbackProvider as unknown as openAiCompatType,
				}) as openAiCompatType,
		);
	}

	public custom(args: AiRequestConfig) {
		return new AiRawProviders(this.config).custom(args);
	}

	public async googleAi(args: AiRequestConfig) {
		return new AiRawProviders(this.config).googleAi(args);
	}
}
