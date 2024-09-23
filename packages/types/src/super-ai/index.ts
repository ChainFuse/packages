import type { JSONSchema7 } from 'json-schema';
import { workersAiCatalog } from './workers-ai-catalog.js';

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
export const default_mc_generic: type_mc_generic = '@hf/nousresearch/hermes-2-pro-mistral-7b';

export const possibilities_mc_summary = [...possibilities_base.map((modelName) => ({ name: modelName })), ...workersAiCatalog.modelGroups.Summarization.models] as const;
export type type_mc_summary = aiProviders<'Summarization'>;
export const default_mc_summary: type_mc_summary = enabledAzureLlmProviders.Azure_OpenAi_Gpt3;

export const possibilities_mc_extraction = [...possibilities_base.map((modelName) => ({ name: modelName })), ...(workersAiCatalog.modelGroups['Text Generation'].models.filter((model) => 'function_calling' in model.properties && model.properties.function_calling) as unknown as [cloudflareFilteredModelPossibilitiesRaw<'Text Generation', 'function_calling', true>])] as const;
export type type_mc_extraction = aiFunctionProviders;
export const default_mc_extraction: type_mc_extraction = '@hf/nousresearch/hermes-2-pro-mistral-7b';

export const possibilities_mc_tagging = [...possibilities_base.map((modelName) => ({ name: modelName })), ...(workersAiCatalog.modelGroups['Text Generation'].models.filter((model) => 'function_calling' in model.properties && model.properties.function_calling) as unknown as [cloudflareFilteredModelPossibilitiesRaw<'Text Generation', 'function_calling', true>])] as const;
export type type_mc_tagging = aiFunctionProviders;
export const default_mc_tagging: type_mc_tagging = enabledAzureLlmProviders.Azure_OpenAi_Gpt4o;

export const possibilities_mc_sentiment = [...possibilities_base.map((modelName) => ({ name: modelName })), ...(workersAiCatalog.modelGroups['Text Generation'].models.filter((model) => 'function_calling' in model.properties && model.properties.function_calling) as unknown as [cloudflareFilteredModelPossibilitiesRaw<'Text Generation', 'function_calling', true>])] as const;
export type type_mc_sentiment = aiFunctionProviders;
export const default_mc_sentiment: type_mc_sentiment = '@hf/nousresearch/hermes-2-pro-mistral-7b';

export const possibilities_mc_safety = [...possibilities_base.map((modelName) => ({ name: modelName })), ...workersAiCatalog.modelGroups['Text Generation'].models] as const;
export type type_mc_safety = aiProviders<'Text Generation'>;
export const default_mc_safety: type_mc_safety = '@hf/thebloke/llamaguard-7b-awq';

export const possibilities_mc_embedding = [...possibilities_embeddings.map((modelName) => ({ name: modelName })), ...workersAiCatalog.modelGroups['Text Embeddings'].models] as const;
export type type_mc_embedding = aiEmbeddingProviders;
export const default_mc_embedding: type_mc_embedding = '@cf/baai/bge-large-en-v1.5';
