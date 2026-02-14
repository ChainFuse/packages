import type { AzureOpenAIProvider as OriginalAzureOpenAIProvider } from '@ai-sdk/azure';
import type { EmbeddingModelV3, ImageModelV3, LanguageModelV3 } from '@ai-sdk/provider';
import type { AzureChatModels, AzureEmbeddingModels, AzureImageModels } from '@chainfuse/types/ai-tools/azure';

export interface AzureOpenAIProvider extends OriginalAzureOpenAIProvider {
	(deploymentId: (typeof AzureChatModels)[number]): LanguageModelV3;
	/**
	 * Creates an Azure OpenAI chat model for text generation.
	 */
	languageModel(deploymentId: (typeof AzureChatModels)[number]): LanguageModelV3;
	/**
	 * Creates an Azure OpenAI chat model for text generation.
	 */
	chat(deploymentId: (typeof AzureChatModels)[number]): LanguageModelV3;
	/**
	 * Creates an Azure OpenAI responses API model for text generation.
	 */
	responses(deploymentId: (typeof AzureChatModels)[number]): LanguageModelV3;
	/**
	 * Creates an Azure OpenAI completion model for text generation.
	 */
	completion(deploymentId: (typeof AzureChatModels)[number]): LanguageModelV3;
	/**
	 * Creates an Azure OpenAI model for text embeddings.
	 */
	embedding(deploymentId: (typeof AzureEmbeddingModels)[number]): EmbeddingModelV3;
	/**
	 * Creates an Azure OpenAI model for text embeddings.
	 */
	embeddingModel(deploymentId: (typeof AzureEmbeddingModels)[number]): EmbeddingModelV3;
	/**
	 * @deprecated Use `embedding` instead.
	 */
	textEmbedding(deploymentId: (typeof AzureEmbeddingModels)[number]): EmbeddingModelV3;
	/**
	 * @deprecated Use `embeddingModel` instead.
	 */
	textEmbeddingModel(deploymentId: (typeof AzureEmbeddingModels)[number]): EmbeddingModelV3;
	/**
	 * Creates an Azure OpenAI DALL-E model for image generation.
	 */
	image(deploymentId: (typeof AzureImageModels)[number]): ImageModelV3;
	/**
	 * Creates an Azure OpenAI DALL-E model for image generation.
	 */
	imageModel(deploymentId: (typeof AzureImageModels)[number]): ImageModelV3;
}
