import { BufferHelpers, CryptoHelpers, Helpers } from '@chainfuse/helpers';
import { AiBase } from '../base.mjs';
import type { AiRequestConfig, AiRequestIdempotencyId, AiRequestMetadata } from '../types.mjs';

export class AiRawProviders extends AiBase {
	// 2628288 seconds is what cf defines as 1 month in their cache rules
	private readonly cacheTtl = 2628288;

	public oaiOpenai(args: AiRequestConfig) {
		return import('@ai-sdk/openai').then(async ({ createOpenAI }) =>
			createOpenAI({
				baseURL: new URL(['v1', this._config.gateway.accountId, this._config.environment, 'openai'].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
				apiKey: this._config.providers.openAi.apiToken,
				organization: this._config.providers.openAi.organization,
				headers: {
					'cf-aig-token': `Bearer ${this._config.gateway.apiToken}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: args.dataspaceId,
						executor: JSON.stringify(args.executor satisfies Exclude<AiRequestMetadata['executor'], string>),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8 as AiRequestIdempotencyId),
						serverInfo: JSON.stringify({
							name: 'openai',
						} satisfies Exclude<AiRequestMetadata['serverInfo'], string>),
						/**
						 * Blank at first, add after request finishes
						 * CF AI Gateway allows only editing existing metadata not creating new ones after the request is made
						 */
						timing: JSON.stringify({}),
					} satisfies AiRequestMetadata),
					...(args.cache && { 'cf-aig-cache-ttl': (typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache).toString() }),
					...(args.skipCache && { 'cf-aig-skip-cache': 'true' }),
				},
				compatibility: 'strict',
				fetch: async (input, rawInit) => {
					const headers = new Headers(rawInit?.headers);
					const metadataHeader = JSON.parse(headers.get('cf-aig-metadata')!) as AiRequestMetadata;
					if (!metadataHeader.idempotencyId.includes('.')) {
						metadataHeader.idempotencyId = `${metadataHeader.idempotencyId}.${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(-8)}`;
						headers.set('cf-aig-metadata', JSON.stringify(metadataHeader));
					}

					if (args.logging ?? this._config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return fetch(input, { ...rawInit, headers }).then(async (response) => {
						if (args.logging ?? this._config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);
						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);

						if (response.ok) {
							return new Response(response.body, { ...response, headers: mutableHeaders });
						} else {
							const [body1, body2] = response.body!.tee();

							console.error('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

							return new Response(body2, { ...response, headers: mutableHeaders });
						}
					});
				},
			}),
		);
	}

	public azOpenai(args: AiRequestConfig, server: string) {
		return import('@ai-sdk/azure').then(async ({ createAzure }) =>
			createAzure({
				apiKey: this.config.providers.azureOpenAi.apiTokens[`AZURE_API_KEY_${server.toUpperCase().replaceAll('-', '_')}`]!,
				/**
				 * @link https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#api-specs
				 * From the table, pick the `Latest GA release` for `Data plane - inference`
				 */
				apiVersion: '2024-10-21',
				baseURL: new URL(['v1', this._config.gateway.accountId, this._config.environment, 'azure-openai', server.toLowerCase()].join('/'), 'https://gateway.ai.cloudflare.com').toString(),
				headers: {
					'cf-aig-token': `Bearer ${this._config.gateway.apiToken}`,
					'cf-aig-metadata': JSON.stringify({
						dataspaceId: args.dataspaceId,
						executor: JSON.stringify(args.executor satisfies Exclude<AiRequestMetadata['executor'], string>),
						// Generate incomplete id because we don't have the body to hash yet. Fill it in in the `fetch()`
						idempotencyId: args.idempotencyId ?? ((await BufferHelpers.generateUuid).utf8 as AiRequestIdempotencyId),
						serverInfo: JSON.stringify({
							name: 'openai',
						} satisfies Exclude<AiRequestMetadata['serverInfo'], string>),
						/**
						 * Blank at first, add after request finishes
						 * CF AI Gateway allows only editing existing metadata not creating new ones after the request is made
						 */
						timing: JSON.stringify({}),
					} satisfies AiRequestMetadata),
					...(args.cache && { 'cf-aig-cache-ttl': (typeof args.cache === 'boolean' ? (args.cache ? this.cacheTtl : 0) : args.cache).toString() }),
					...(args.skipCache && { 'cf-aig-skip-cache': 'true' }),
				},
				fetch: async (input, rawInit) => {
					const headers = new Headers(rawInit?.headers);
					const metadataHeader = JSON.parse(headers.get('cf-aig-metadata')!) as AiRequestMetadata;
					if (!metadataHeader.idempotencyId.includes('.')) {
						metadataHeader.idempotencyId = `${metadataHeader.idempotencyId}.${(await CryptoHelpers.getHash('SHA-256', await new Request(input, rawInit).arrayBuffer())).slice(-8)}`;
						headers.set('cf-aig-metadata', JSON.stringify(metadataHeader));
					}

					if (args.logging ?? this._config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return fetch(input, { ...rawInit, headers }).then(async (response) => {
						if (args.logging ?? this._config.environment !== 'production') console.info('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						// Inject it to have it available for retries
						const mutableHeaders = new Headers(response.headers);
						mutableHeaders.set('X-Idempotency-Id', metadataHeader.idempotencyId);

						if (response.ok) {
							return new Response(response.body, { ...response, headers: mutableHeaders });
						} else {
							const [body1, body2] = response.body!.tee();

							console.error('ai', 'raw provider', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

							return new Response(body2, { ...response, headers: mutableHeaders });
						}
					});
				},
			}),
		);
	}
}