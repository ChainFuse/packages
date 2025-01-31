import { enabledCloudflareLlmEmbeddingProviders, enabledCloudflareLlmFunctionProviders, enabledCloudflareLlmProviders, type cloudflareFilteredModelPossibilities, type cloudflareModelPossibilities, type cloudflareModelTypes } from '../super-ai/index.js';
import { workersAiCatalog } from './workers-ai-catalog.js';

export interface RawCoordinate {
	lat: string;
	lon: string;
}

export const enabledCloudflareLlmImageProviders: cloudflareModelPossibilities<'Text-to-Image'>[] = workersAiCatalog.modelGroups['Text-to-Image'].models.map((model) => model.name);

export type CloudflareModelsEnum<M extends cloudflareModelTypes = cloudflareModelTypes> = {
	[K in cloudflareModelPossibilities<M>]: `workersai:${K}`;
};
export type CloudflareFunctionModelsEnum = {
	[K in cloudflareFilteredModelPossibilities<'Text Generation', 'function_calling', true>]: `workersai:${K}`;
};

export type AzureChatModels = 'gpt-35-turbo' | 'gpt-4-turbo' | 'gpt-4o-mini' | 'gpt-4o';
export type AzureImageModels = 'dall-e-3' | 'dall-e-2';
export type AzureEmbeddingModels = 'text-embedding-3-small' | 'text-embedding-3-large';

export namespace AiModels {
	export namespace LanguageModels {
		export enum Azure {
			gpt3 = 'azure:gpt-35-turbo',
			gpt4o_mini = 'azure:gpt-4o-mini',
			gpt4 = 'azure:gpt-4-turbo',
			gpt4o = 'azure:gpt-4o',
		}

		export enum Anthropic {
			haiku = 'anthropic:claude-3-5-haiku-latest',
			sonnet = 'anthropic:claude-3-5-sonnet-latest',
		}

		// export const CloudflareSummary = Object.freeze(Object.fromEntries(enabledCloudflareLlmSummaryProviders.map((model) => [model, `workersai:${model}`])) as unknown as CloudflareModelsEnum<'Summarization'>);
		// export const CloudflareClassification = Object.freeze(Object.fromEntries(enabledCloudflareLlmClassificationProviders.map((model) => [model, `workersai:${model}`])) as unknown as CloudflareModelsEnum<'Text Classification'>);
		export const Cloudflare = Object.freeze(Object.fromEntries(enabledCloudflareLlmProviders.map((model) => [model, `workersai:${model}`])) as unknown as CloudflareModelsEnum<'Text Generation'>);
		export const CloudflareFunctions = Object.freeze(Object.fromEntries(enabledCloudflareLlmFunctionProviders.map((model) => [model, `workersai:${model}`])) as unknown as CloudflareFunctionModelsEnum);

		export enum GoogleGenerativeAi {
			gemini_flash_beta = 'google.generative-ai:gemini-2.0-flash-exp',
			gemini_flash_beta_search = 'google.generative-ai:gemini-2.0-flash-exp:search',
			gemini_flash = 'google.generative-ai:gemini-1.5-flash',
			gemini_flash_search = 'google.generative-ai:gemini-1.5-flash:search',
			gemini_pro = 'google.generative-ai:gemini-1.5-pro',
			gemini_pro_search = 'google.generative-ai:gemini-1.5-pro:search',
		}

		export enum OpenAi {
			gpt3 = 'openai:gpt-3.5-turbo',
			gpt4o_mini = 'openai:gpt-4o-mini',
			o1_mini = 'openai:o1-mini',
			gpt4 = 'openai:gpt-4-turbo',
			gpt4o = 'openai:gpt-4o',
			o1 = 'openai:o1-preview',
		}
	}

	export namespace ImageModels {
		export enum Azure {
			dalle3 = 'azure:dall-e-3',
			dalle2 = 'azure:dall-e-2',
		}

		export enum Anthropic {}

		export const Cloudflare = Object.freeze(Object.fromEntries(enabledCloudflareLlmImageProviders.map((model) => [model, `workersai:${model}`])) as unknown as CloudflareModelsEnum<'Text-to-Image'>);

		export enum GoogleGenerativeAi {
			imagen = 'google.generative-ai:imagen-3.0-generate-002',
			imagen_fast = 'google.generative-ai:imagen-3.0-fast-generate-001',
		}

		export enum OpenAi {
			dalle3 = 'openai:dall-e-3',
			dalle2 = 'openai:dall-e-2',
		}
	}

	export namespace TextEmbeddingModels {
		export enum Azure {
			te3_large = 'azure:text-embedding-3-large',
			te3_small = 'azure:text-embedding-3-small',
		}

		export const Cloudflare = Object.freeze(Object.fromEntries(enabledCloudflareLlmEmbeddingProviders.map((model) => [model, `workersai:${model}`])) as unknown as CloudflareModelsEnum<'Text Embeddings'>);

		export enum GoogleGenerativeAi {
			te4 = 'google.generative-ai:text-embedding-004',
		}

		export enum OpenAi {
			te3_large = 'openai:text-embedding-3-large',
			te3_small = 'openai:text-embedding-3-small',
		}
	}
}

export type EnumOrEnumLike<T> = T extends Record<string, infer V> ? V : T extends Readonly<Record<string, infer V>> ? V : never;
export type LanguageModelValues = EnumOrEnumLike<(typeof AiModels.LanguageModels)[keyof typeof AiModels.LanguageModels]>;
export type ImageModelValues = EnumOrEnumLike<(typeof AiModels.ImageModels)[keyof typeof AiModels.ImageModels]>;
export type TextEmbeddingModelValues = EnumOrEnumLike<(typeof AiModels.TextEmbeddingModels)[keyof typeof AiModels.TextEmbeddingModels]>;

export const default_mc_generic: LanguageModelValues = AiModels.LanguageModels.Azure.gpt4o_mini;
export const default_mc_summary: LanguageModelValues = AiModels.LanguageModels.Cloudflare['@cf/meta/llama-3.3-70b-instruct-fp8-fast'];
export const default_mc_extraction: LanguageModelValues = AiModels.LanguageModels.Azure.gpt4o_mini;
export const default_mc_tagging: LanguageModelValues = AiModels.LanguageModels.Azure.gpt4o_mini;
export const default_mc_sentiment: LanguageModelValues = AiModels.LanguageModels.Azure.gpt4o_mini;
export const default_mc_safety: LanguageModelValues = AiModels.LanguageModels.Cloudflare['@hf/thebloke/llamaguard-7b-awq'];
export const default_mc_image: ImageModelValues = AiModels.ImageModels.Cloudflare['@cf/stabilityai/stable-diffusion-xl-base-1.0'];
export const default_mc_embedding: TextEmbeddingModelValues = AiModels.TextEmbeddingModels.Cloudflare['@cf/baai/bge-large-en-v1.5'];
