import type { OpenAICompatibleProvider } from '@ai-sdk/openai-compatible';
import { type cloudflareModelPossibilities } from '@chainfuse/types/ai-tools/workers-ai';
import { AiBase } from '../base.mjs';
import type { AiConfigWorkersai, AiConfigWorkersaiRest, AiRequestConfig } from '../types.mjs';
import { AiRawProviders } from './rawProviders.mjs';

export class AiCustomProviders extends AiBase {
	public oaiOpenai(args: AiRequestConfig) {
		return new AiRawProviders(this.config).oaiOpenai(args);
	}

	public async azOpenai(args: AiRequestConfig) {
		const fallbackProvider = await new AiRawProviders(this.config).azOpenai(args);

		return Promise.all([import('ai'), import('@chainfuse/types/ai-tools/azure')]).then(async ([{ customProvider }, { AzureEmbeddingModels, AzureChatModels, AzureImageModels }]) =>
			customProvider({
				// Rewrite to carry over types (`customProvider` overwrites to `string`)
				embeddingModels: await AzureEmbeddingModels.reduce(
					async (accPromise, model) => {
						const acc = await accPromise;
						acc[model] = fallbackProvider.embedding(model);
						return acc;
					},
					Promise.resolve({} as Record<(typeof AzureEmbeddingModels)[number], ReturnType<(typeof fallbackProvider)['embedding']>>),
				),
				// Must use Azure's `.chat()` since CF Ai Gateway doesn't support Responses API
				languageModels: await AzureChatModels.reduce(
					async (accPromise, model) => {
						const acc = await accPromise;
						acc[model] = fallbackProvider.chat(model);
						return acc;
					},
					Promise.resolve({} as Record<(typeof AzureChatModels)[number], ReturnType<(typeof fallbackProvider)['chat']>>),
				),
				imageModels: await AzureImageModels.reduce(
					async (accPromise, model) => {
						const acc = await accPromise;
						acc[model] = fallbackProvider.image(model);
						return acc;
					},
					Promise.resolve({} as Record<(typeof AzureImageModels)[number], ReturnType<(typeof fallbackProvider)['image']>>),
				),
				// The rest are compatible as is
				fallbackProvider: fallbackProvider,
			}),
		);
	}

	public anthropic(args: AiRequestConfig) {
		return new AiRawProviders(this.config).anthropic(args);
	}

	public custom(args: AiRequestConfig) {
		return new AiRawProviders(this.config).custom(args);
	}

	public async googleAi(args: AiRequestConfig) {
		return new AiRawProviders(this.config).googleAi(args);
	}

	private static workersAiIsRest(arg: AiConfigWorkersai): arg is AiConfigWorkersaiRest {
		return typeof arg === 'object' && 'apiToken' in arg;
	}

	public async workersAi(args: AiRequestConfig) {
		const raw = new AiRawProviders(this.config);

		if (AiCustomProviders.workersAiIsRest(this.config.providers.workersAi)) {
			const fallbackProvider = await raw.restWorkersAi(args);

			return Promise.all([import('ai'), import('@chainfuse/types/ai-tools/workers-ai')]).then(async ([{ customProvider }, { enabledCloudflareLlmEmbeddingProviders, enabledCloudflareLlmImageProviders, enabledCloudflareLlmProviders, enabledCloudflareLlmSpeechProviders, enabledCloudflareLlmTranscriptionProviders }]) =>
				customProvider({
					// Workers AI exposes it as `textEmbedding` but ai sdk expects `embeddingModel`
					embeddingModels: await enabledCloudflareLlmEmbeddingProviders.reduce(
						async (accPromise, model) => {
							const acc = await accPromise;
							acc[model] = fallbackProvider.embeddingModel(model);
							return acc;
						},
						Promise.resolve({} as Record<cloudflareModelPossibilities<'Text Embeddings'>, ReturnType<(typeof fallbackProvider)['embeddingModel']>>),
					),
					// Rewrite to carry over types (`workers-ai-provider` resolves to `any`)
					imageModels: await enabledCloudflareLlmImageProviders.reduce(
						async (accPromise, model) => {
							const acc = await accPromise;
							acc[model] = fallbackProvider.imageModel(model);
							return acc;
						},
						Promise.resolve({} as Record<cloudflareModelPossibilities<'Text-to-Image'>, ReturnType<(typeof fallbackProvider)['imageModel']>>),
					),
					// Workers AI exposes it as `chat` but ai sdk expects `languageModel`
					languageModels: await enabledCloudflareLlmProviders.reduce(
						async (accPromise, model) => {
							const acc = await accPromise;
							acc[model] = fallbackProvider.chatModel(model);
							return acc;
						},
						Promise.resolve({} as Record<cloudflareModelPossibilities<'Text Generation'>, ReturnType<(typeof fallbackProvider)['chatModel']>>),
					),
					...('speechModel' in fallbackProvider && {
						// Rewrite to carry over types (`workers-ai-provider` resolves to `any`)
						speechModels: await enabledCloudflareLlmSpeechProviders.reduce(
							async (accPromise, model) => {
								const acc = await accPromise;
								acc[model] = fallbackProvider.speechModel!(model);
								return acc;
							},
							Promise.resolve({} as Record<cloudflareModelPossibilities<'Text-to-Speech'>, ReturnType<Exclude<(typeof fallbackProvider)['speechModel'], undefined>>>),
						),
					}),
					...('transcriptionModel' in fallbackProvider && {
						// Rewrite to carry over types (`workers-ai-provider` resolves to `any`)
						transcriptionModels: await enabledCloudflareLlmTranscriptionProviders.reduce(
							async (accPromise, model) => {
								const acc = await accPromise;
								acc[model] = fallbackProvider.transcriptionModel!(model);
								return acc;
							},
							Promise.resolve({} as Record<cloudflareModelPossibilities<'Automatic Speech Recognition'>, ReturnType<Exclude<(typeof fallbackProvider)['transcriptionModel'], undefined>>>),
						),
					}),
					// The rest are compatible as is
					fallbackProvider: fallbackProvider,
				}),
			);
		} else {
			const fallbackProvider = await raw.bindingWorkersAi(args);
			type openAiCompatType = OpenAICompatibleProvider<cloudflareModelPossibilities<'Text Generation'>, cloudflareModelPossibilities<'Text Generation'>, cloudflareModelPossibilities<'Text Embeddings'>, cloudflareModelPossibilities<'Text-to-Image'>>;

			return Promise.all([import('ai'), import('@chainfuse/types/ai-tools/workers-ai')]).then(async ([{ customProvider }, { enabledCloudflareLlmEmbeddingProviders, enabledCloudflareLlmImageProviders, enabledCloudflareLlmProviders, enabledCloudflareLlmSpeechProviders, enabledCloudflareLlmTranscriptionProviders }]) =>
				customProvider({
					// Workers AI exposes it as `textEmbedding` but ai sdk expects `embeddingModel`
					embeddingModels: await enabledCloudflareLlmEmbeddingProviders.reduce(
						async (accPromise, model) => {
							const acc = await accPromise;
							acc[model] = fallbackProvider.textEmbedding(model);
							return acc;
						},
						Promise.resolve({} as Record<cloudflareModelPossibilities<'Text Embeddings'>, ReturnType<(typeof fallbackProvider)['textEmbedding']>>),
					),
					// Rewrite to carry over types (`workers-ai-provider` resolves to `any`)
					imageModels: await enabledCloudflareLlmImageProviders.reduce(
						async (accPromise, model) => {
							const acc = await accPromise;
							acc[model] = fallbackProvider.image(model);
							return acc;
						},
						Promise.resolve({} as Record<cloudflareModelPossibilities<'Text-to-Image'>, ReturnType<(typeof fallbackProvider)['image']>>),
					),
					// Workers AI exposes it as `chat` but ai sdk expects `languageModel`
					languageModels: await enabledCloudflareLlmProviders.reduce(
						async (accPromise, model) => {
							const acc = await accPromise;
							acc[model] = fallbackProvider.chat(model);
							return acc;
						},
						Promise.resolve({} as Record<cloudflareModelPossibilities<'Text Generation'>, ReturnType<(typeof fallbackProvider)['chat']>>),
					),
					// Rewrite to carry over types (`workers-ai-provider` resolves to `any`)
					speechModels: await enabledCloudflareLlmSpeechProviders.reduce(
						async (accPromise, model) => {
							const acc = await accPromise;
							acc[model] = fallbackProvider.speech(model);
							return acc;
						},
						Promise.resolve({} as Record<cloudflareModelPossibilities<'Text-to-Speech'>, ReturnType<(typeof fallbackProvider)['speech']>>),
					),
					// Rewrite to carry over types (`workers-ai-provider` resolves to `any`)
					transcriptionModels: await enabledCloudflareLlmTranscriptionProviders.reduce(
						async (accPromise, model) => {
							const acc = await accPromise;
							acc[model] = fallbackProvider.transcription(model);
							return acc;
						},
						Promise.resolve({} as Record<cloudflareModelPossibilities<'Automatic Speech Recognition'>, ReturnType<(typeof fallbackProvider)['transcription']>>),
					),
					// The rest are compatible as is
					fallbackProvider: fallbackProvider as unknown as openAiCompatType,
				}),
			);
		}
	}
}
