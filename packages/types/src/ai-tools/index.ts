import { z } from 'zod/v4';
import type { EnumOrEnumLike, ObjectValues } from '../index.js';
import type { ZodCoordinate } from '../zod/index.js';
import { enabledCloudflareLlmEmbeddingProviders, enabledCloudflareLlmFunctionProviders, enabledCloudflareLlmImageProviders, enabledCloudflareLlmProviders, type CloudflareFunctionModelsEnum, type CloudflareModelsEnum } from './workers-ai/index.js';

export interface Coordinate {
	lat: z.infer<typeof ZodCoordinate>;
	lon: z.infer<typeof ZodCoordinate>;
}

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

		/**
		 * @link https://ai.google.dev/gemini-api/docs/models
		 */
		export enum GoogleGenerativeAi {
			gemini_flash_lite = 'google.generative-ai:gemini-2.0-flash-lite',
			gemini_flash_lite_search = 'google.generative-ai:gemini-2.0-flash-lite:search',
			gemini_flash = 'google.generative-ai:gemini-2.5-flash-preview',
			gemini_flash_search = 'google.generative-ai:gemini-2.5-flash-preview:search',
			gemini_pro = 'google.generative-ai:gemini-2.5-pro-preview',
			gemini_pro_search = 'google.generative-ai:gemini-2.5-pro-preview:search',
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

const ZodLanguageModelValuesRaw = Object.entries(AiModels.LanguageModels).reduce(
	(acc, [, value]) => {
		acc.push(value as unknown as EnumOrEnumLike<typeof AiModels.LanguageModels>);
		return acc;
	},
	[] as EnumOrEnumLike<typeof AiModels.LanguageModels>[],
);
export const ZodLanguageModelValues = z.enum(Object.values(Object.assign({}, ...ZodLanguageModelValuesRaw) as (typeof ZodLanguageModelValuesRaw)[number]) as [ObjectValues<(typeof ZodLanguageModelValuesRaw)[number]>[number], ...ObjectValues<(typeof ZodLanguageModelValuesRaw)[number]>]);
export type LanguageModelValues = z.infer<typeof ZodLanguageModelValues>;
const ZodImageModelValuesRaw = Object.entries(AiModels.ImageModels).reduce(
	(acc, [, value]) => {
		acc.push(value as unknown as EnumOrEnumLike<typeof AiModels.ImageModels>);
		return acc;
	},
	[] as EnumOrEnumLike<typeof AiModels.ImageModels>[],
);
export const ZodImageModelValues = z.enum(Object.values(Object.assign({}, ...ZodImageModelValuesRaw) as (typeof ZodImageModelValuesRaw)[number]) as [ObjectValues<(typeof ZodImageModelValuesRaw)[number]>[number], ...ObjectValues<(typeof ZodImageModelValuesRaw)[number]>]);
export type ImageModelValues = z.infer<typeof ZodImageModelValues>;
const ZodTextEmbeddingModelValuesRaw = Object.entries(AiModels.TextEmbeddingModels).reduce(
	(acc, [, value]) => {
		acc.push(value as unknown as EnumOrEnumLike<typeof AiModels.TextEmbeddingModels>);
		return acc;
	},
	[] as EnumOrEnumLike<typeof AiModels.TextEmbeddingModels>[],
);
export const ZodTextEmbeddingModelValues = z.enum(Object.values(Object.assign({}, ...ZodTextEmbeddingModelValuesRaw) as (typeof ZodTextEmbeddingModelValuesRaw)[number]) as [ObjectValues<(typeof ZodTextEmbeddingModelValuesRaw)[number]>[number], ...ObjectValues<(typeof ZodTextEmbeddingModelValuesRaw)[number]>]);
export type TextEmbeddingModelValues = z.infer<typeof ZodTextEmbeddingModelValues>;

export const default_mc_generic: LanguageModelValues = AiModels.LanguageModels.Azure.gpt4o_mini;
export const default_mc_summary: LanguageModelValues = AiModels.LanguageModels.Azure.gpt4o;
export const default_mc_extraction: LanguageModelValues = AiModels.LanguageModels.Azure.gpt4o_mini;
export const default_mc_tagging: LanguageModelValues = AiModels.LanguageModels.Azure.gpt4o;
export const default_mc_sentiment: LanguageModelValues = AiModels.LanguageModels.Azure.gpt4o_mini;
export const default_mc_safety: LanguageModelValues = AiModels.LanguageModels.Cloudflare['@hf/thebloke/llamaguard-7b-awq'];
export const default_mc_image: ImageModelValues = AiModels.ImageModels.Cloudflare['@cf/stabilityai/stable-diffusion-xl-base-1.0'];
export const default_mc_embedding: TextEmbeddingModelValues = AiModels.TextEmbeddingModels.Cloudflare['@cf/baai/bge-large-en-v1.5'];
