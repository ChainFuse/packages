import type { OpenAIProvider } from '@ai-sdk/openai';
import { BufferHelpers, CryptoHelpers } from '@chainfuse/helpers';
import { Chalk } from 'chalk';
import type { AiConfig, AiRequestConfig, AiRequestIdempotencyId, AiRequestMetadata } from './types.mjs';

export class AiProviders {
	protected readonly chalk = new Chalk({ level: 3 });
	protected _config: AiConfig;
	// 2628288 seconds is what cf defines as 1 month in their cache rules
	protected readonly cacheTtl = 2628288;

	constructor(config: AiConfig) {
		this._config = config;
	}

	public get config(): Readonly<AiConfig> {
		return this._config;
	}

	private static uniqueRequestColor(id: AiRequestIdempotencyId): Parameters<InstanceType<typeof Chalk>['rgb']> {
		// Hash the string to a numeric value
		let hash = 0;
		for (let i = 0; i < id.length; i++) {
			const char = id.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash |= 0; // Convert to 32-bit integer
		}

		// Convert the hash to RGB components
		let r = (hash & 0xff0000) >> 16; // Extract red
		let g = (hash & 0x00ff00) >> 8; // Extract green
		let b = hash & 0x0000ff; // Extract blue

		// Clamp RGB values to a more legible range (e.g., 64-200)
		const clamp = (value: number) => Math.max(100, Math.min(222, value));
		r = clamp(r);
		g = clamp(g);
		b = clamp(b);

		return [r, g, b];
	}

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

					if (args.logging ?? this._config.environment !== 'production') console.debug('ai', this.chalk.rgb(...AiProviders.uniqueRequestColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.magenta(rawInit?.method), this.chalk.magenta(new URL(new Request(input).url).pathname));

					return fetch(input, { ...rawInit, headers }).then(async (response) => {
						if (response.ok) {
							return response;
						} else {
							const [body1, body2] = response.body!.tee();

							console.error('ai', this.chalk.rgb(...AiProviders.uniqueRequestColor(metadataHeader.idempotencyId))(`[${metadataHeader.idempotencyId}]`), this.chalk.bold.red(response.status), this.chalk.red(JSON.stringify(await new Response(body1, response).json())));

							return new Response(body2, response);
						}
					});
				},
			});
		});
	}
}
