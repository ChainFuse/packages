import type { EmbeddingModelV2, LanguageModelV2, ProviderV2 } from '@ai-sdk/provider';
import type { AzureChatModels, AzureEmbeddingModels } from '@chainfuse/types/ai-tools/azure';

export interface AzureOpenAIProvider extends ProviderV2 {
	(deploymentId: AzureChatModels): LanguageModelV2;
	/**
	 * Creates an Azure OpenAI chat model for text generation.
	 */
	languageModel(deploymentId: AzureChatModels): LanguageModelV2;
	/**
	 * Creates an Azure OpenAI chat model for text generation.
	 */
	chat(deploymentId: AzureChatModels): LanguageModelV2;
	/**
	 * Creates an Azure OpenAI responses API model for text generation.
	 */
	responses(deploymentId: AzureChatModels): LanguageModelV2;
	/**
	 * Creates an Azure OpenAI completion model for text generation.
	 */
	completion(deploymentId: AzureChatModels): LanguageModelV2;
	/**
	 * Creates an Azure OpenAI DALL-E model for image generation.
	 */
	// image(deploymentId: AzureImageModels): ImageModelV2;
	/**
	 * Creates an Azure OpenAI DALL-E model for image generation.
	 */
	// imageModel(deploymentId: AzureImageModels): ImageModelV2;
	textEmbedding(deploymentId: AzureEmbeddingModels): EmbeddingModelV2<string>;
	/**
	 * Creates an Azure OpenAI model for text embeddings.
	 */
	textEmbeddingModel(deploymentId: AzureEmbeddingModels): EmbeddingModelV2<string>;
}
