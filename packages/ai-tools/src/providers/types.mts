import type { AzureOpenAIProvider as OriginalAzureOpenAIProvider } from '@ai-sdk/azure';
import type { EmbeddingModelV3, LanguageModelV3 } from '@ai-sdk/provider';
import type { AzureChatModels, AzureEmbeddingModels } from '@chainfuse/types/ai-tools/azure';

export interface AzureOpenAIProvider extends OriginalAzureOpenAIProvider {
	(deploymentId: AzureChatModels): LanguageModelV3;
	/**
	 * Creates an Azure OpenAI chat model for text generation.
	 */
	languageModel(deploymentId: AzureChatModels): LanguageModelV3;
	/**
	 * Creates an Azure OpenAI chat model for text generation.
	 */
	chat(deploymentId: AzureChatModels): LanguageModelV3;
	/**
	 * Creates an Azure OpenAI responses API model for text generation.
	 */
	responses(deploymentId: AzureChatModels): LanguageModelV3;
	/**
	 * Creates an Azure OpenAI completion model for text generation.
	 */
	completion(deploymentId: AzureChatModels): LanguageModelV3;
	/**
	 * Creates an Azure OpenAI model for text embeddings.
	 */
	embedding(deploymentId: AzureEmbeddingModels): EmbeddingModelV3;
	/**
	 * Creates an Azure OpenAI model for text embeddings.
	 */
	embeddingModel(deploymentId: AzureEmbeddingModels): EmbeddingModelV3;
	/**
	 * @deprecated Use `embedding` instead.
	 */
	textEmbedding(deploymentId: string): EmbeddingModelV3;
	/**
	 * @deprecated Use `embeddingModel` instead.
	 */
	textEmbeddingModel(deploymentId: string): EmbeddingModelV3;
}
