import type { OpenAIProvider } from '@ai-sdk/openai';
import { BufferHelpers, CryptoHelpers, Helpers } from '@chainfuse/helpers';
import { AiBase } from './base.mjs';
import type { AiRequestConfig, AiRequestIdempotencyId, AiRequestMetadata } from './types.mjs';

/**
 * @todo @demosjarco migrate to provider registry
 */
export class AiProviders extends AiBase {
	// 2628288 seconds is what cf defines as 1 month in their cache rules
	private readonly cacheTtl = 2628288;

	public oaiOpenai(args: AiRequestConfig): Promise<OpenAIProvider> {
		return import('@ai-sdk/openai').then(async ({ createOpenAI }) => {
			return createOpenAI({
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

					if (args.logging ?? this._config.environment !== 'production') console.info('ai', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return fetch(input, { ...rawInit, headers }).then(async (response) => {
						console.info('ai', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), response.ok ? this.chalk.green(response.status) : this.chalk.red(response.status), response.ok ? this.chalk.green(new URL(response.url).pathname) : this.chalk.red(new URL(response.url).pathname));

						if (response.ok) {
							return response;
						} else {
							const [body1, body2] = response.body!.tee();

							console.error('ai', this.chalk.rgb(...Helpers.uniqueIdColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

							return new Response(body2, response);
						}
					});
				},
			});
		});
	}
}
