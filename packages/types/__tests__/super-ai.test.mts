import { SuperAi, type llmProviders, type llmRequestProperties } from '@chainfuse/super-ai';
import type { ExecutionContext, IncomingRequestCfProperties } from '@cloudflare/workers-types/experimental';
import { ok, strictEqual } from 'node:assert/strict';
import test, { afterEach, before, beforeEach, describe } from 'node:test';
import { enabledCloudflareLlmFunctionProviders, enabledCloudflareLlmProviders, type aiFunctionProviders, type aiProviders } from '../dist/super-ai/index.js';

const { CF_ACCOUNT_ID, CICD_CF_API_TOKEN } = process.env;

let geoJson: IncomingRequestCfProperties;
let superAi: SuperAi;

before(async () => {
	geoJson = await fetch(new URL('https://workers.cloudflare.com/cf.json')).then((geoResponse) => geoResponse.json());
});

void describe('AI Response Tests', () => {
	let waitUntilPromises: Promise<any>[] = [];

	beforeEach(() => {
		waitUntilPromises = [];
		superAi = new SuperAi(
			{
				waitUntil(promise) {
					waitUntilPromises.push(promise);
				},
			} as ExecutionContext,
			{
				geoRouting: {
					userCoordinate: {
						lat: Number(geoJson.latitude),
						lon: Number(geoJson.longitude),
					},
					country: geoJson.country,
					continent: geoJson.continent,
				},
				cloudflare: {
					accountId: CF_ACCOUNT_ID!.replaceAll(`"`, ``),
					apiToken: CICD_CF_API_TOKEN!.replaceAll(`"`, ``),
				},
				openAi: {
					apiToken: '' as ConstructorParameters<typeof SuperAi>[1]['openAi']['apiToken'],
					organization: '' as ConstructorParameters<typeof SuperAi>[1]['openAi']['organization'],
				},
				azureOpenAi: {
					apiTokens: {},
				},
				workersAi: {
					apiToken: CICD_CF_API_TOKEN!.replaceAll(`"`, ``),
				},
				anthropic: {
					apiToken: '' as ConstructorParameters<typeof SuperAi>[1]['anthropic']['apiToken'],
				},
			},
		);
	});

	afterEach(async () => {
		await Promise.all(waitUntilPromises);
	});

	for (const stream of [true, false]) {
		for (const llmProviderKey of enabledCloudflareLlmProviders) {
			const settings: llmRequestProperties = { stream, max_tokens: 128 };

			void test(JSON.stringify({ model: llmProviderKey, ...settings }), async () => {
				const response = await superAi.llm({
					providerPreferences: [{ [llmProviderKey]: 1 }] as llmProviders<aiProviders>[],
					messages: [
						{
							role: 'user',
							content: 'Tell me about black holes',
						},
					],
					settings,
					tracking: {
						dataspaceId: 'internal',
					},
				});

				response.stream?.on('data', (chunk) => {
					// console.info(JSON.stringify(chunk, null, '\t'));

					strictEqual(typeof chunk.role, 'string');
					strictEqual(typeof chunk.content, 'string');
					ok(chunk.timestamp instanceof Date);
				});
				response.stream?.once('end', () => {
					response.stream?.removeAllListeners();
				});

				const fullResponse = await response.message;

				// console.info(fullResponse);

				strictEqual(typeof fullResponse.role, 'string');
				strictEqual(typeof fullResponse.content, 'string');
				ok(fullResponse.timestamp instanceof Date);
			});
		}
	}
});

void describe('AI Function Tests', async () => {
	let waitUntilPromises: Promise<any>[] = [];

	beforeEach(() => {
		waitUntilPromises = [];
		superAi = new SuperAi(
			{
				waitUntil(promise) {
					waitUntilPromises.push(promise);
				},
			} as ExecutionContext,
			{
				geoRouting: {
					userCoordinate: {
						lat: Number(geoJson.latitude),
						lon: Number(geoJson.longitude),
					},
					country: geoJson.country,
					continent: geoJson.continent,
				},
				cloudflare: {
					accountId: CF_ACCOUNT_ID!.replaceAll(`"`, ``),
					apiToken: CICD_CF_API_TOKEN!.replaceAll(`"`, ``),
				},
				openAi: {
					apiToken: '' as ConstructorParameters<typeof SuperAi>[1]['openAi']['apiToken'],
					organization: '' as ConstructorParameters<typeof SuperAi>[1]['openAi']['organization'],
				},
				azureOpenAi: {
					apiTokens: {},
				},
				workersAi: {
					apiToken: CICD_CF_API_TOKEN!.replaceAll(`"`, ``),
				},
				anthropic: {
					apiToken: '' as ConstructorParameters<typeof SuperAi>[1]['anthropic']['apiToken'],
				},
			},
		);
	});

	afterEach(async () => {
		await Promise.all(waitUntilPromises);
	});

	for (const stream of [true, false]) {
		for (const llmProviderKey of enabledCloudflareLlmFunctionProviders) {
			const settings: llmRequestProperties = { stream, max_tokens: 128 };

			void test(JSON.stringify({ model: llmProviderKey, ...settings }), async () => {
				const response = await superAi.llm({
					providerPreferences: [{ [llmProviderKey]: 1 }] as llmProviders<aiFunctionProviders>[],
					messages: [
						{
							role: 'system',
							content: 'You are a running in a CI/CD test. Use the available tool `get-conn-info` to get full debug statistics of the entire connection including geolocation information',
						},
						{
							role: 'user',
							content: 'Where (geographically) are you running? Return in the specified format',
						},
					],
					settings,
					tracking: {
						dataspaceId: 'internal',
					},
					tools: [
						{
							name: 'get-conn-info',
							description: 'Get the current connection info including headers and geographical information',
							// eslint-disable-next-line @typescript-eslint/require-await
							function: async () => JSON.stringify(geoJson),
							parameters: {
								type: 'object',
								properties: {},
							},
						},
					],
					schema: {
						description: 'Return the current city and state of the runner',
						parameters: {
							type: 'object',
							properties: {
								city: {
									type: 'string',
									description: 'City of the incoming request',
								},
								state: {
									type: 'string',
									description: 'The ISO 3166-2 name for the first level region of the incoming request',
								},
							},
						},
					},
				});

				response.stream?.on('data', (chunk) => {
					// console.info(JSON.stringify(chunk, null, '\t'));

					strictEqual(typeof chunk.role, 'string');
					strictEqual(typeof chunk.content, 'object');
					ok(chunk.timestamp instanceof Date);
				});
				response.stream?.once('end', () => {
					response.stream?.removeAllListeners();
				});

				const fullResponse = await response.message;
				// console.debug(fullResponse);

				strictEqual(typeof fullResponse.role, 'string');
				strictEqual(typeof fullResponse.content, 'object');
				ok('city' in (fullResponse.content as Record<string, any>));
				strictEqual(typeof (fullResponse.content as Record<string, any>)['city'], 'string');
				ok('state' in (fullResponse.content as Record<string, any>));
				strictEqual(typeof (fullResponse.content as Record<string, any>)['state'], 'string');
				ok(fullResponse.timestamp instanceof Date);
			});
		}
	}
});
