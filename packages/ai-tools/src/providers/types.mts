import type { OpenAIChatSettings, OpenAIEmbeddingSettings } from '@ai-sdk/openai/internal';
import type { EmbeddingModelV1, LanguageModelV1 } from '@ai-sdk/provider';
import type { AzureChatModels, AzureEmbeddingModels, cloudflareModelPossibilities } from '@chainfuse/types';
import type { Provider } from 'ai';
import type { createWorkersAI, WorkersAI } from 'workers-ai-provider';

export interface AzureOpenAIProvider extends Provider {
	(deploymentId: AzureChatModels, settings?: OpenAIChatSettings): LanguageModelV1;
	/**
	 * Creates an Azure OpenAI chat model for text generation.
	 */
	languageModel(deploymentId: AzureChatModels, settings?: OpenAIChatSettings): LanguageModelV1;
	/**
	 * Creates an Azure OpenAI model for text embeddings.
	 */
	textEmbeddingModel(deploymentId: AzureEmbeddingModels, settings?: OpenAIEmbeddingSettings): EmbeddingModelV1<string>;
	/**
	 * Creates a model for image generation.
	 */
	// imageModel(modelId: AzureImageModels, settings?: Parameters<OpenAIProvider['imageModel']>[1]): ImageModelV1;
}

export interface WorkersAIProvider extends WorkersAI {
	(modelId: cloudflareModelPossibilities<'Text Generation'>, settings?: Parameters<typeof createWorkersAI>[0]): ReturnType<ReturnType<typeof createWorkersAI>>;
	/**
	 * Creates a model for text generation.
	 **/
	chat(modelId: cloudflareModelPossibilities<'Text Generation'>, settings?: Parameters<typeof createWorkersAI>[0]): ReturnType<ReturnType<typeof createWorkersAI>['chat']>;
	/**
	 * Creates an Azure OpenAI chat model for text generation.
	 */
	languageModel(modelId: cloudflareModelPossibilities<'Text Generation'>, settings?: Parameters<typeof createWorkersAI>[0]): ReturnType<ReturnType<typeof createWorkersAI>>;
	/**
	 * Creates an Azure OpenAI model for text embeddings.
	 */
	textEmbeddingModel(modelId: cloudflareModelPossibilities<'Text Embeddings'>, settings?: Parameters<typeof createWorkersAI>[0]): EmbeddingModelV1<string>;
	/**
	 * Creates a model for image generation.
	 */
	// imageModel(modelId: cloudflareModelPossibilities<'Text-to-Image'>, settings?: Parameters<typeof createWorkersAI>[0]): ImageModelV1;
}
