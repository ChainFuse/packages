import type { AzureChatModels, AzureEmbeddingModels, Coordinate } from '@chainfuse/types';
import type { PrivacyRegion } from './base.mjs';

export interface Server {
	id: string;
	coordinate: Coordinate;
	region?: PrivacyRegion;
	availability: (AzureChatModels | AzureEmbeddingModels)[] | string[];
}
