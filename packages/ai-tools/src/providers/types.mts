import type { OpenAIChatSettings, OpenAIEmbeddingSettings } from '@ai-sdk/openai/internal';
import type { EmbeddingModelV2, LanguageModelV2 } from '@ai-sdk/provider';
import type { AzureChatModels, AzureEmbeddingModels } from '@chainfuse/types/ai-tools/azure';
import type { Provider } from 'ai';

export interface AzureOpenAIProvider extends Provider {
	(deploymentId: AzureChatModels, settings?: OpenAIChatSettings): LanguageModelV2;
	/**
	 * Creates an Azure OpenAI chat model for text generation.
	 */
	languageModel(deploymentId: AzureChatModels, settings?: OpenAIChatSettings): LanguageModelV2;
	/**
	 * Creates an Azure OpenAI model for text embeddings.
	 */
	textEmbeddingModel(deploymentId: AzureEmbeddingModels, settings?: OpenAIEmbeddingSettings): EmbeddingModelV2<string>;
	/**
	 * Creates a model for image generation.
	 */
	// imageModel(modelId: AzureImageModels, settings?: Parameters<OpenAIProvider['imageModel']>[1]): ImageModelV1;
}
