import * as zm from 'zod/mini';
import * as z4 from 'zod/v4';
import type { EnumOrEnumLike, ObjectValues } from '../index.js';
import type { ZodCoordinate } from '../zod-mini/index.js';
import { enabledCloudflareLlmEmbeddingProviders, enabledCloudflareLlmFunctionProviders, enabledCloudflareLlmImageProviders, enabledCloudflareLlmProviders, type CloudflareFunctionModelsEnum, type CloudflareModelsEnum } from './workers-ai/index.js';

export interface Coordinate {
	lat: zm.infer<typeof ZodCoordinate>;
	lon: zm.infer<typeof ZodCoordinate>;
}

export namespace AiModels {
	export namespace LanguageModels {
		export enum Azure {
			gpt41_nano = 'azure:gpt-4.1-nano',
			gpt5_nano = 'azure:gpt-5-nano',
			gpt4o_mini = 'azure:gpt-4o-mini',
			gpt41_mini = 'azure:gpt-4.1-mini',
			gpt5_mini = 'azure:gpt-5-mini',
			o3_mini = 'azure:o3-mini',
			o4_mini = 'azure:o4-mini',
			gpt4o = 'azure:gpt-4o',
			gpt41 = 'azure:gpt-4.1',
			gpt5 = 'azure:gpt-5',
			gpt51 = 'azure:gpt-5.1',
			o1 = 'azure:o1',
			o3 = 'azure:o3',
		}

		export enum Anthropic {
			sonnet = 'anthropic:claude-4-sonnet-latest',
			haiku = 'anthropic:claude-4-opus-latest',
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
			gemini_flash = 'google.generative-ai:gemini-2.5-flash-preview',
			gemini_pro = 'google.generative-ai:gemini-2.5-pro-preview',
		}

		export enum OpenAi {
			gpt41_nano = 'openai:gpt-4.1-nano',
			gpt5_nano = 'openai:gpt-5-nano',
			gpt4o_mini = 'openai:gpt-4o-mini',
			gpt41_mini = 'openai:gpt-4.1-mini',
			gpt5_mini = 'openai:gpt-5-mini',
			o1_mini = 'openai:o1-mini',
			o3_mini = 'openai:o3-mini',
			o4_mini = 'openai:o4-mini',
			gpt4o = 'openai:gpt-4o',
			gpt41 = 'openai:gpt-4.1',
			gpt5 = 'openai:gpt-5',
			gpt51 = 'openai:gpt-5.1',
			o1 = 'openai:o1',
			o3 = 'openai:o3',
		}
	}

	export namespace ImageModels {
		export enum Azure {
			gpt1 = 'azure:gpt-image-1',
		}

		export const Cloudflare = Object.freeze(Object.fromEntries(enabledCloudflareLlmImageProviders.map((model) => [model, `workersai:${model}`])) as unknown as CloudflareModelsEnum<'Text-to-Image'>);

		export enum GoogleGenerativeAi {
			imagen = 'google.generative-ai:imagen-3.0-generate-002',
			imagen_fast = 'google.generative-ai:imagen-3.0-fast-generate-001',
		}

		export enum OpenAi {
			gpt1 = 'openai:gpt-image-1',
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
export const ZodLanguageModelValues = zm.enum(Object.values(Object.assign({}, ...ZodLanguageModelValuesRaw) as (typeof ZodLanguageModelValuesRaw)[number]) as [ObjectValues<(typeof ZodLanguageModelValuesRaw)[number]>[number], ...ObjectValues<(typeof ZodLanguageModelValuesRaw)[number]>]);
export const ZodLanguageModelValues4 = z4.enum(Object.values(Object.assign({}, ...ZodLanguageModelValuesRaw) as (typeof ZodLanguageModelValuesRaw)[number]) as [ObjectValues<(typeof ZodLanguageModelValuesRaw)[number]>[number], ...ObjectValues<(typeof ZodLanguageModelValuesRaw)[number]>]);
export type LanguageModelValues = zm.infer<typeof ZodLanguageModelValues>;
const ZodImageModelValuesRaw = Object.entries(AiModels.ImageModels).reduce(
	(acc, [, value]) => {
		acc.push(value as unknown as EnumOrEnumLike<typeof AiModels.ImageModels>);
		return acc;
	},
	[] as EnumOrEnumLike<typeof AiModels.ImageModels>[],
);
export const ZodImageModelValues = zm.enum(Object.values(Object.assign({}, ...ZodImageModelValuesRaw) as (typeof ZodImageModelValuesRaw)[number]) as [ObjectValues<(typeof ZodImageModelValuesRaw)[number]>[number], ...ObjectValues<(typeof ZodImageModelValuesRaw)[number]>]);
export const ZodImageModelValues4 = z4.enum(Object.values(Object.assign({}, ...ZodImageModelValuesRaw) as (typeof ZodImageModelValuesRaw)[number]) as [ObjectValues<(typeof ZodImageModelValuesRaw)[number]>[number], ...ObjectValues<(typeof ZodImageModelValuesRaw)[number]>]);
export type ImageModelValues = zm.infer<typeof ZodImageModelValues>;
const ZodTextEmbeddingModelValuesRaw = Object.entries(AiModels.TextEmbeddingModels).reduce(
	(acc, [, value]) => {
		acc.push(value as unknown as EnumOrEnumLike<typeof AiModels.TextEmbeddingModels>);
		return acc;
	},
	[] as EnumOrEnumLike<typeof AiModels.TextEmbeddingModels>[],
);
export const ZodTextEmbeddingModelValues = zm.enum(Object.values(Object.assign({}, ...ZodTextEmbeddingModelValuesRaw) as (typeof ZodTextEmbeddingModelValuesRaw)[number]) as [ObjectValues<(typeof ZodTextEmbeddingModelValuesRaw)[number]>[number], ...ObjectValues<(typeof ZodTextEmbeddingModelValuesRaw)[number]>]);
export const ZodTextEmbeddingModelValues4 = z4.enum(Object.values(Object.assign({}, ...ZodTextEmbeddingModelValuesRaw) as (typeof ZodTextEmbeddingModelValuesRaw)[number]) as [ObjectValues<(typeof ZodTextEmbeddingModelValuesRaw)[number]>[number], ...ObjectValues<(typeof ZodTextEmbeddingModelValuesRaw)[number]>]);
export type TextEmbeddingModelValues = zm.infer<typeof ZodTextEmbeddingModelValues>;

export const default_mc_generic: LanguageModelValues = AiModels.LanguageModels.Azure.gpt5_mini;
export const default_mc_summary: LanguageModelValues = AiModels.LanguageModels.Azure.gpt5_nano;
export const default_mc_extraction: LanguageModelValues = AiModels.LanguageModels.Azure.gpt5_nano;
export const default_mc_tagging: LanguageModelValues = AiModels.LanguageModels.Azure.gpt5_nano;
export const default_mc_sentiment: LanguageModelValues = AiModels.LanguageModels.Azure.gpt5_nano;
export const default_mc_safety: LanguageModelValues = AiModels.LanguageModels.Cloudflare['@cf/meta/llama-guard-3-8b'];
export const default_mc_image: ImageModelValues = AiModels.ImageModels.Cloudflare['@cf/stabilityai/stable-diffusion-xl-base-1.0'];
export const default_mc_embedding: TextEmbeddingModelValues = AiModels.TextEmbeddingModels.Cloudflare['@cf/baai/bge-large-en-v1.5'];
