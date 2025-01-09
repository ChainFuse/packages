import type { PrefixedUuid, RawCoordinate, UuidExport } from '@chainfuse/types';
import type { Ai, ExecutionContext, IncomingRequestCfProperties } from '@cloudflare/workers-types/experimental';
import type haversine from 'haversine-distance';

export interface AiConfig {
	gateway: {
		accountId: string;
		apiToken: string;
	};
	geoRouting?: {
		userCoordinate?: RawCoordinate;
		country?: IncomingRequestCfProperties['country'];
		continent?: IncomingRequestCfProperties['continent'];
	};
	environment: 'production' | 'preview';
	providers: AiConfigProviders;
	backgroundContext?: ExecutionContext;
}

export interface AiConfigProviders {
	anthropic: AiConfigAnthropic;
	azureOpenAi: AiConfigAzOpenai;
	custom?: AiConfigCustom;
	googleAi: AiConfigGoogleAi;
	openAi: AiConfigOaiOpenai;
	workersAi: AiConfigWorkersai;
}
export interface AiConfigAnthropic {
	apiToken: `sk-ant-${string}`;
}
export interface AiConfigAzOpenai {
	apiTokens: Record<`AZURE_API_KEY_${string}`, string>;
}
export interface AiConfigCustom extends AiConfigCustomZT {
	/**
	 * For safety resons, no direct IPs allowed.
	 */
	url: string;
	dohId: string;
	apiToken?: string;
}
export interface AiConfigCustomZT {
	clientId: string;
	clientSecret: string;
}
export interface AiConfigGoogleAi {
	apiToken: string;
}
export interface AiConfigOaiOpenai {
	apiToken: `sk-${string}`;
	organization: `org-${string}`;
}
export type AiConfigWorkersai = AiConfigWorkersaiRest | AiConfigWorkersaiBinding;
export interface AiConfigWorkersaiRest {
	apiToken: string;
}
/**
 * @deprecated Not functional. Use REST instead
 */
export type AiConfigWorkersaiBinding = Ai;

/**
 * It's a UUID, but the last block is SHA256 of the request body
 */
export type AiRequestIdempotencyId = UuidExport['utf8'];
export interface AiRequestExecutor {
	type: 'worker' | 'queue' | 'workflow' | 'githubCicd';
	id: string;
}

export interface AiRequestConfig {
	/**
	 * Sets if a response should be cached (1 month) or for any custom duration
	 * @default true
	 */
	cache?: boolean | number;
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	dataspaceId: PrefixedUuid | UuidExport['utf8'] | UuidExport['hex'];
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
	name: 'anthropic' | 'cloudflare' | 'googleai' | 'openai';
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

/**
 * Extracts the chunk type from an asynchronous iterable.
 */
export type AiStreamChunkType<T> = T extends AsyncIterable<infer U> ? Awaited<U> : never;
