import type { JSONSchema7 } from 'json-schema';
import { workersAiCatalog } from './workers-ai-catalog.js';

export interface RawCoordinate {
	lat: string;
	lon: string;
}
export interface Coordinate {
	lat: number;
	lon: number;
}

type ToolJsonSchemaDefinition = ToolJsonSchema | boolean;
export interface ToolJsonSchema extends Omit<JSONSchema7, '$id' | '$ref' | '$schema' | '$defs' | 'title' | 'readOnly' | 'writeOnly'> {
	properties?: Record<string, ToolJsonSchemaDefinition>;
}
export interface ToolJsonRoot extends Omit<ToolJsonSchema, 'type'> {
	type: 'object';
}

export enum enabledAzureLlmProviders {
	Azure_OpenAi_Gpt3 = 'azure_openai_gpt3',
	Azure_OpenAi_Gpt4o_mini = 'azure_openai_gpt4o_mini',
	Azure_OpenAi_Gpt4 = 'azure_openai_gpt4',
	Azure_OpenAi_Gpt4o = 'azure_openai_gpt4o',
}
export enum enabledAzureLlmEmbeddingProviders {
	Azure_OpenAi_Embed3_Large = 'azure_openai_embed3_large',
	Azure_OpenAi_Embed3_Small = 'azure_openai_embed3_small',
}

export type cloudflareModelTypes = keyof typeof workersAiCatalog.modelGroups;
export type cloudflareModelPossibilitiesRaw<M extends cloudflareModelTypes = cloudflareModelTypes> = (typeof workersAiCatalog.modelGroups)[M]['models'][number];
export type cloudflareModelPossibilities<M extends cloudflareModelTypes = cloudflareModelTypes> = cloudflareModelPossibilitiesRaw<M>['name'];
type cloudflareModelProperties<Model> = Model extends { properties: infer Props } ? keyof Props : never;
type cloudflareModelPossibilitiesProperties<M extends cloudflareModelTypes = cloudflareModelTypes> = cloudflareModelProperties<cloudflareModelPossibilitiesRaw<M>>;
export type cloudflareFilteredModelPossibilitiesRaw<M extends cloudflareModelTypes = cloudflareModelTypes, K extends cloudflareModelPossibilitiesProperties<M> = cloudflareModelPossibilitiesProperties<M>, V extends cloudflareModelPossibilitiesRaw<M>['properties'][K] = any> = cloudflareModelPossibilitiesRaw<M> extends infer Model ? (Model extends { properties: Record<K, V> } ? Model : never) : never;
export type cloudflareFilteredModelPossibilities<M extends cloudflareModelTypes = cloudflareModelTypes, K extends cloudflareModelPossibilitiesProperties<M> = cloudflareModelPossibilitiesProperties<M>, V extends cloudflareModelPossibilitiesRaw<M>['properties'][K] = any> = cloudflareFilteredModelPossibilitiesRaw<M, K, V>['name'];
export const enabledCloudflareLlmSummaryProviders: cloudflareModelPossibilities<'Summarization'>[] = workersAiCatalog.modelGroups.Summarization.models.map((model) => model.name);
export const enabledCloudflareLlmClassificationProviders: cloudflareModelPossibilities<'Text Classification'>[] = workersAiCatalog.modelGroups['Text Classification'].models.map((model) => model.name);
export const enabledCloudflareLlmEmbeddingProviders: cloudflareModelPossibilities<'Text Embeddings'>[] = workersAiCatalog.modelGroups['Text Embeddings'].models.map((model) => model.name);
export const enabledCloudflareLlmProviders: cloudflareModelPossibilities<'Text Generation'>[] = workersAiCatalog.modelGroups['Text Generation'].models.map((model) => model.name);
export const enabledCloudflareLlmFunctionProviders = workersAiCatalog.modelGroups['Text Generation'].models.filter((model) => 'function_calling' in model.properties && model.properties.function_calling).map((model) => model.name as cloudflareFilteredModelPossibilities<'Text Generation', 'function_calling', true>);

export type aiProviders<M extends Exclude<cloudflareModelTypes, 'Text Embeddings'> = Exclude<cloudflareModelTypes, 'Text Embeddings'>> = enabledAzureLlmProviders | cloudflareModelPossibilities<M>;
export type aiEmbeddingProviders = enabledAzureLlmEmbeddingProviders | cloudflareModelPossibilities<'Text Embeddings'>;
export type aiFunctionProviders = enabledAzureLlmProviders | cloudflareFilteredModelPossibilities<'Text Generation', 'function_calling', true>;

const possibilities_base = [...(Object.values(enabledAzureLlmProviders) as unknown as [keyof typeof enabledAzureLlmProviders])] as const;
const possibilities_embeddings = [...(Object.values(enabledAzureLlmEmbeddingProviders) as unknown as [keyof typeof enabledAzureLlmEmbeddingProviders])] as const;

export const possibilities_mc_generic = [...possibilities_base.map((modelName) => ({ name: modelName })), ...(workersAiCatalog.modelGroups['Text Generation'].models.filter((model) => 'function_calling' in model.properties && model.properties.function_calling) as unknown as [cloudflareFilteredModelPossibilitiesRaw<'Text Generation', 'function_calling', true>])] as const;
export type type_mc_generic = aiFunctionProviders;

export const possibilities_mc_summary = [...possibilities_base.map((modelName) => ({ name: modelName })), ...workersAiCatalog.modelGroups.Summarization.models] as const;
export type type_mc_summary = aiProviders<'Summarization'>;

export const possibilities_mc_extraction = [...possibilities_base.map((modelName) => ({ name: modelName })), ...(workersAiCatalog.modelGroups['Text Generation'].models.filter((model) => 'function_calling' in model.properties && model.properties.function_calling) as unknown as [cloudflareFilteredModelPossibilitiesRaw<'Text Generation', 'function_calling', true>])] as const;
export type type_mc_extraction = aiFunctionProviders;

export const possibilities_mc_tagging = [...possibilities_base.map((modelName) => ({ name: modelName })), ...(workersAiCatalog.modelGroups['Text Generation'].models.filter((model) => 'function_calling' in model.properties && model.properties.function_calling) as unknown as [cloudflareFilteredModelPossibilitiesRaw<'Text Generation', 'function_calling', true>])] as const;
export type type_mc_tagging = aiFunctionProviders;

export const possibilities_mc_sentiment = [...possibilities_base.map((modelName) => ({ name: modelName })), ...(workersAiCatalog.modelGroups['Text Generation'].models.filter((model) => 'function_calling' in model.properties && model.properties.function_calling) as unknown as [cloudflareFilteredModelPossibilitiesRaw<'Text Generation', 'function_calling', true>])] as const;
export type type_mc_sentiment = aiFunctionProviders;

export const possibilities_mc_safety = [...possibilities_base.map((modelName) => ({ name: modelName })), ...workersAiCatalog.modelGroups['Text Generation'].models] as const;
export type type_mc_safety = aiProviders<'Text Generation'>;

export const possibilities_mc_embedding = [...possibilities_embeddings.map((modelName) => ({ name: modelName })), ...workersAiCatalog.modelGroups['Text Embeddings'].models] as const;
export type type_mc_embedding = aiEmbeddingProviders;

// New AI

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
			gpt3 = 'azure:gpt-3.5-turbo',
			gpt4o_mini = 'azure:gpt-4o-mini',
			gpt4 = 'azure:gpt-4-turbo',
			gpt4o = 'azure:gpt-4o',
		}

		export const CloudflareSummary = Object.freeze(Object.fromEntries(enabledCloudflareLlmSummaryProviders.map((model) => [model, `workersai:${model}`])) as unknown as CloudflareModelsEnum<'Summarization'>);
		export const CloudflareClassification = Object.freeze(Object.fromEntries(enabledCloudflareLlmClassificationProviders.map((model) => [model, `workersai:${model}`])) as unknown as CloudflareModelsEnum<'Text Classification'>);
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
