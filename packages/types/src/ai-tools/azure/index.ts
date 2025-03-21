import type { azureCatalog } from './catalog.js';

export type AzureChatModels = (typeof azureCatalog)[number]['languageModelAvailability'][number]['name'];
// type AzureImageModels = (typeof azureCatalog)[number]['imageModelAvailability'][number];
export type AzureEmbeddingModels = (typeof azureCatalog)[number]['textEmbeddingModelAvailability'][number];
