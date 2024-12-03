import type { Coordinate, UuidExport } from '@chainfuse/types';
import type { Ai, IncomingRequestCfProperties } from '@cloudflare/workers-types/experimental';
import type haversine from 'haversine-distance';

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
	organization: `org-${string}`;
}
export interface AiConfigWorkersaiRest {
	apiToken: string;
}
export type AiConfigWorkersaiBinding = Ai;
export type AiConfigWorkersai = AiConfigWorkersaiRest | AiConfigWorkersaiBinding;

export type AiRequestIdempotencyId = `${UuidExport['utf8']}.${string}`;
export interface AiRequestExecutor {
	type: 'worker' | 'queue' | 'workflow';
	id: string;
}

export interface AiRequestConfig {
	/**
	 * Sets if a response should be cached (1 month) or for any custom duration
	 * @default true
	 */
	cache?: boolean | number;
	dataspaceId: UuidExport['utf8'];
	/**
	 * Service identification of caller
	 */
	executor: AiRequestExecutor;
	/**
	 * Identify the same request across multiple calls. If not provided, a new id will be generated
	 * Structure: <UUIDv7>.<last 8 of SHA256 of body>
	 */
	idempotencyId?: AiRequestIdempotencyId;
	/**
	 * Logging includes anything up to the ai call. For ai call info, see ai gateway
	 * @default false (on production environment), true (on preview environment)
	 */
	logging?: boolean;
	/**
	 * Force a response to be generated even if a matching request is already cached (without changing cache setting)
	 * @default false
	 */
	skipCache?: boolean;
}

export interface AiRequestMetadataServerInfo {
	name: 'anthropic' | 'cloudflare' | 'openai';
}
export interface AiRequestMetadataServerInfoWithLocation {
	name: `${'azure' | 'google'}-${string}`;
	/**
	 * @returns distance in meters
	 */
	distance: ReturnType<typeof haversine>;
}
export interface AiRequestMetadataTiming {
	modelTime?: number;
	fromCache: boolean;
	totalRoundtripTime: number;
	/**
	 * @todo @demosjarco add more timing info
	 */
}
export interface AiRequestMetadata {
	dataspaceId: AiRequestConfig['dataspaceId'];
	serverInfo: AiRequestMetadataServerInfo | AiRequestMetadataServerInfoWithLocation | string;
	idempotencyId: AiRequestIdempotencyId;
	executor: AiRequestExecutor | string;
	timing: AiRequestMetadataTiming | string;
}