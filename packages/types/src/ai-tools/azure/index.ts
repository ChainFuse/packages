import { azureCatalog } from './catalog.js';

export const AzureChatModels = azureCatalog.map(({ languageModelAvailability }) => languageModelAvailability.map(({ name }) => name)).flat();
export type AzureImageModels = (typeof azureCatalog)[number]['imageModelAvailability'][number]['name'];
export type AzureEmbeddingModels = (typeof azureCatalog)[number]['textEmbeddingModelAvailability'][number]['name'];
