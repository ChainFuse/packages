import { workersAiCatalog } from './catalog.js';

type cloudflareModelTypes = keyof typeof workersAiCatalog.modelGroups;
type cloudflareModelPossibilitiesRaw<M extends cloudflareModelTypes = cloudflareModelTypes> = (typeof workersAiCatalog.modelGroups)[M]['models'][number];
export type cloudflareModelPossibilities<M extends cloudflareModelTypes = cloudflareModelTypes> = cloudflareModelPossibilitiesRaw<M>['name'];
type cloudflareModelProperties<Model> = Model extends { properties: infer Props } ? keyof Props : never;
type cloudflareModelPossibilitiesProperties<M extends cloudflareModelTypes = cloudflareModelTypes> = cloudflareModelProperties<cloudflareModelPossibilitiesRaw<M>>;
type cloudflareFilteredModelPossibilitiesRaw<M extends cloudflareModelTypes = cloudflareModelTypes, K extends cloudflareModelPossibilitiesProperties<M> = cloudflareModelPossibilitiesProperties<M>, V extends cloudflareModelPossibilitiesRaw<M>['properties'][K] = any> = cloudflareModelPossibilitiesRaw<M> extends infer Model ? (Model extends { properties: Record<K, V> } ? Model : never) : never;
type cloudflareFilteredModelPossibilities<M extends cloudflareModelTypes = cloudflareModelTypes, K extends cloudflareModelPossibilitiesProperties<M> = cloudflareModelPossibilitiesProperties<M>, V extends cloudflareModelPossibilitiesRaw<M>['properties'][K] = any> = cloudflareFilteredModelPossibilitiesRaw<M, K, V>['name'];
// const enabledCloudflareLlmSummaryProviders: cloudflareModelPossibilities<'Summarization'>[] = workersAiCatalog.modelGroups.Summarization.models.map((model) => model.name);
// const enabledCloudflareLlmClassificationProviders: cloudflareModelPossibilities<'Text Classification'>[] = workersAiCatalog.modelGroups['Text Classification'].models.map((model) => model.name);
export const enabledCloudflareLlmEmbeddingProviders: cloudflareModelPossibilities<'Text Embeddings'>[] = workersAiCatalog.modelGroups['Text Embeddings'].models.map((model) => model.name);
export const enabledCloudflareLlmProviders: cloudflareModelPossibilities<'Text Generation'>[] = workersAiCatalog.modelGroups['Text Generation'].models.map((model) => model.name);
export const enabledCloudflareLlmFunctionProviders = workersAiCatalog.modelGroups['Text Generation'].models.filter((model) => 'function_calling' in model.properties && model.properties.function_calling).map((model) => model.name as cloudflareFilteredModelPossibilities<'Text Generation', 'function_calling', true>);

export const enabledCloudflareLlmImageProviders: cloudflareModelPossibilities<'Text-to-Image'>[] = workersAiCatalog.modelGroups['Text-to-Image'].models.map((model) => model.name);

export type CloudflareModelsEnum<M extends cloudflareModelTypes = cloudflareModelTypes> = {
	[K in cloudflareModelPossibilities<M>]: `workersai:${K}`;
};
export type CloudflareFunctionModelsEnum = {
	[K in cloudflareFilteredModelPossibilities<'Text Generation', 'function_calling', true>]: `workersai:${K}`;
};
