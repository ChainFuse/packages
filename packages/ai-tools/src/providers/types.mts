import type { OpenAIChatSettings, OpenAIEmbeddingSettings } from '@ai-sdk/openai';
import type { EmbeddingModelV1, LanguageModelV1 } from '@ai-sdk/provider';
import type { AzureChatModels, AzureEmbeddingModels, cloudflareModelPossibilities } from '@chainfuse/types';
import type { Provider } from 'ai';

export interface AzureOpenAIProvider extends Provider {
	(deploymentId: AzureChatModels, settings?: OpenAIChatSettings): LanguageModelV1;
	/**
  Creates an Azure OpenAI chat model for text generation.
     */
	languageModel(deploymentId: AzureChatModels, settings?: OpenAIChatSettings): LanguageModelV1;
	/**
  Creates an Azure OpenAI model for text embeddings.
     */
	textEmbeddingModel(deploymentId: AzureEmbeddingModels, settings?: OpenAIEmbeddingSettings): EmbeddingModelV1<string>;
}

export interface CloudflareOpenAIProvider extends Provider {
	(deploymentId: cloudflareModelPossibilities<'Text Generation'>, settings?: OpenAIChatSettings): LanguageModelV1;
	/**
  Creates an Azure OpenAI chat model for text generation.
     */
	languageModel(deploymentId: cloudflareModelPossibilities<'Text Generation'>, settings?: OpenAIChatSettings): LanguageModelV1;
	/**
  Creates an Azure OpenAI model for text embeddings.
     */
	textEmbeddingModel(deploymentId: cloudflareModelPossibilities<'Text Embeddings'>, settings?: OpenAIEmbeddingSettings): EmbeddingModelV1<string>;
}
