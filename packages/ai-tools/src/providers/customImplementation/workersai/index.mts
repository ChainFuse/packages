import type { EmbeddingModelV1, LanguageModelV1, ProviderV1 } from '@ai-sdk/provider';
import type { cloudflareModelPossibilities } from '@chainfuse/types';
import type { Ai, AiOptions } from '@cloudflare/workers-types/experimental';
import { WorkersAiChatLanguageModel } from './workersai-chat-language-model.mjs';
import type { WorkersAiChatSettings, WorkersAiEmbeddingSettings, WorkersAiSummarizationSettings } from './workersai-chat-settings';

// model factory function with additional methods and properties
export interface WorkersAIBinding extends ProviderV1 {
	(modelId: cloudflareModelPossibilities<'Text Generation'>, settings?: WorkersAiChatSettings): LanguageModelV1;

	/**
	 * Creates a model for text generation.
	 */
	languageModel(modelId: cloudflareModelPossibilities<'Text Generation'>, settings?: WorkersAiChatSettings): LanguageModelV1;

	/**
	 * Creates a model for text generation.
	 */
	chat(modelId: cloudflareModelPossibilities<'Text Generation'>, settings?: WorkersAiChatSettings): LanguageModelV1;

	summarize(modelId: cloudflareModelPossibilities<'Summarization'>, settings?: WorkersAiSummarizationSettings): LanguageModelV1;

	textEmbeddingModel: (modelId: cloudflareModelPossibilities<'Text Embeddings'>, settings?: WorkersAiEmbeddingSettings) => EmbeddingModelV1<string>;
}

export interface WorkersAiSettings extends AiOptions {
	/**
	 * Provide an `env.AI` binding to use for the AI inference.
	 * You can set up an AI bindings in your Workers project
	 * by adding the following this to `wrangler.toml`:
	 *
	 * ```toml
	 * [ai]
	 * binding = "AI"
	 * ```
	 **/
	binding: Ai;
}

/**
 * Create a Workers AI provider instance.
 **/
export function createWorkersAI(options: WorkersAiSettings): WorkersAIBinding {
	const createChatModel = (modelId: cloudflareModelPossibilities<'Text Generation'>, settings: WorkersAiChatSettings = {}) =>
		new WorkersAiChatLanguageModel(modelId, settings, {
			provider: 'mistral.chat',
			baseURL,
			headers: getHeaders,
			fetch: options.fetch,
		});

	const createEmbeddingModel = (modelId: cloudflareModelPossibilities<'Text Embeddings'>, settings: WorkersAiEmbeddingSettings = {}) =>
		new MistralEmbeddingModel(modelId, settings, {
			provider: 'mistral.embedding',
			baseURL,
			headers: getHeaders,
			fetch: options.fetch,
		});

	const provider = function (modelId: cloudflareModelPossibilities<'Text Generation'>, settings?: WorkersAiChatSettings) {
		if (new.target) {
			throw new Error('The Mistral model function cannot be called with the new keyword.');
		}

		return createChatModel(modelId, settings);
	};

	provider.languageModel = createChatModel;
	provider.chat = createChatModel;
	provider.textEmbeddingModel = createEmbeddingModel;

	return provider as WorkersAIBinding;
}
