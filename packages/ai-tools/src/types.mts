import type { Coordinate } from '@chainfuse/types';
import type { Ai, IncomingRequestCfProperties } from '@cloudflare/workers-types/experimental';

export interface AiConfig {
	gateway: {
		accountId: string;
		apiToken: string;
	};
	geoRouting?: {
		userCoordinate?: Coordinate;
		country?: IncomingRequestCfProperties['country'];
		continent?: IncomingRequestCfProperties['continent'];
	};
	environment: 'production' | 'preview';
	providers: AiConfigProviders;
}

export interface AiConfigProviders {
	anthropic: AiConfigAnthropic;
	azureOpenAi: AiConfigAzOpenai;
	openAi: AiConfigOaiOpenai;
	workersAi: AiConfigWorkersai;
}
export interface AiConfigAnthropic {
	apiToken: `sk-ant-${string}`;
}
export interface AiConfigAzOpenai {
	apiTokens: Record<`AZURE_API_KEY_${string}`, string>;
}
export interface AiConfigOaiOpenai {
	apiToken: `sk-${string}`;
	organization?: `org-${string}`;
}
export interface AiConfigWorkersaiRest {
	apiToken: string;
}
export type AiConfigWorkersaiBinding = Ai;
export type AiConfigWorkersai = AiConfigWorkersaiRest | AiConfigWorkersaiBinding;
