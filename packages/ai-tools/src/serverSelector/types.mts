import type { AzureChatModels, AzureEmbeddingModels, AzureImageModels, Coordinate } from '@chainfuse/types';
import type { PrivacyRegion } from './base.mjs';

export interface Server {
	id: string;
	coordinate: Coordinate;
	region?: PrivacyRegion;
	languageModelAvailability: AzureChatModels[] | string[];
	imageModelAvailability: AzureImageModels[] | string[];
	textEmbeddingModelAvailability: AzureEmbeddingModels[] | string[];
}
