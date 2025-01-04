import { enabledCloudflareLlmEmbeddingProviders, enabledCloudflareLlmFunctionProviders, enabledCloudflareLlmProviders, type cloudflareFilteredModelPossibilities, type cloudflareModelPossibilities, type cloudflareModelTypes } from '../super-ai/index.js';

export interface RawCoordinate {
	lat: string;
	lon: string;
}

export type CloudflareModelsEnum<M extends cloudflareModelTypes = cloudflareModelTypes> = {
	[K in cloudflareModelPossibilities<M>]: `workersai:${K}`;
};
export type CloudflareFunctionModelsEnum = {
	[K in cloudflareFilteredModelPossibilities<'Text Generation', 'function_calling', true>]: `workersai:${K}`;
};

export type AzureChatModels = 'gpt-35-turbo' | 'gpt-4-turbo' | 'gpt-4o-mini' | 'gpt-4o';
export type AzureEmbeddingModels = 'text-embedding-3-small' | 'text-embedding-3-large';

export namespace AiModels {
	export namespace LanguageModels {
		export enum OpenAi {
			gpt3 = 'openai:gpt-3.5-turbo',
			gpt4o_mini = 'openai:gpt-4o-mini',
			o1_mini = 'openai:o1-mini',
			gpt4 = 'openai:gpt-4-turbo',
			gpt4o = 'openai:gpt-4o',
			o1 = 'openai:o1-preview',
		}

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
	}

	export namespace TextEmbeddingModels {
		export enum OpenAi {
			te3_large = 'openai:text-embedding-3-large',
			te3_small = 'openai:text-embedding-3-small',
		}

		export enum Azure {
			te3_large = 'azure:text-embedding-3-large',
			te3_small = 'azure:text-embedding-3-small',
		}

		export const Cloudflare = Object.freeze(Object.fromEntries(enabledCloudflareLlmEmbeddingProviders.map((model) => [model, `workersai:${model}`])) as unknown as CloudflareModelsEnum<'Text Embeddings'>);
	}
}
