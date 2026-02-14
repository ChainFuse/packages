import { azureCatalog } from './catalog.js';

export const AzureChatModels = azureCatalog.map(({ languageModelAvailability }) => languageModelAvailability.map(({ name }) => name)).flat();
export const AzureImageModels = azureCatalog.map(({ imageModelAvailability }) => imageModelAvailability.map(({ name }) => name)).flat();
export const AzureEmbeddingModels = azureCatalog.map(({ textEmbeddingModelAvailability }) => textEmbeddingModelAvailability.map(({ name }) => name)).flat();
