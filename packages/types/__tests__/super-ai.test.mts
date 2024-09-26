import { SuperAi, type llmProviders, type llmRequestProperties } from '@chainfuse/super-ai';
import type { ExecutionContext, IncomingRequestCfProperties } from '@cloudflare/workers-types/experimental';
import { ok, strictEqual } from 'node:assert/strict';
import test, { afterEach, before, beforeEach, describe } from 'node:test';
import { enabledAzureLlmProviders, enabledCloudflareLlmFunctionProviders, enabledCloudflareLlmProviders, type aiFunctionProviders, type aiProviders } from '../dist/super-ai/index.js';

const { CF_ACCOUNT_ID, AI_GATEWAY_API_KEY, WORKERS_AI_API_KEY } = process.env;
const { OPENAI_API_KEY, OPENAI_ORGANIZATION } = process.env;
const { AZURE_API_KEY_OPENAI_AU_NEWSOUTHWALES, AZURE_API_KEY_OPENAI_BR_SAOPAULOSTATE, AZURE_API_KEY_OPENAI_CA_QUEBEC, AZURE_API_KEY_OPENAI_CA_TORONTO, AZURE_API_KEY_OPENAI_CH_GENEVA, AZURE_API_KEY_OPENAI_CH_ZURICH, AZURE_API_KEY_OPENAI_EU_FRANKFURT, AZURE_API_KEY_OPENAI_EU_GAVLE, AZURE_API_KEY_OPENAI_EU_MADRID, AZURE_API_KEY_OPENAI_EU_NETHERLANDS, AZURE_API_KEY_OPENAI_EU_PARIS, AZURE_API_KEY_OPENAI_EU_WARSAW, AZURE_API_KEY_OPENAI_IN_CHENNAI, AZURE_API_KEY_OPENAI_JP_TOKYO, AZURE_API_KEY_OPENAI_KR_SEOUL, AZURE_API_KEY_OPENAI_NO_OSLO, AZURE_API_KEY_OPENAI_UK_LONDON, AZURE_API_KEY_OPENAI_US_CALIFORNIA, AZURE_API_KEY_OPENAI_US_ILLINOIS, AZURE_API_KEY_OPENAI_US_PHOENIX, AZURE_API_KEY_OPENAI_US_TEXAS, AZURE_API_KEY_OPENAI_US_VIRGINIA, AZURE_API_KEY_OPENAI_US_VIRGINIA2, AZURE_API_KEY_OPENAI_ZA_JOHANNESBURG } = process.env;
const { ANTHROPIC_API_KEY } = process.env;

let geoJson: IncomingRequestCfProperties;
let superAi: SuperAi;

before(async () => {
	geoJson = await fetch(new URL('https://workers.cloudflare.com/cf.json')).then((geoResponse) => geoResponse.json());
});

void describe('AI Response Tests', () => {
	const allLlmProviderKeys = [...Object.values(enabledAzureLlmProviders), ...enabledCloudflareLlmProviders];
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
					apiToken: AI_GATEWAY_API_KEY!.replaceAll(`"`, ``),
				},
				openAi: {
					apiToken: OPENAI_API_KEY!.replaceAll(`"`, ``) as ConstructorParameters<typeof SuperAi>[1]['openAi']['apiToken'],
					organization: OPENAI_ORGANIZATION!.replaceAll(`"`, ``) as ConstructorParameters<typeof SuperAi>[1]['openAi']['organization'],
				},
				azureOpenAi: {
					apiTokens: {
						AZURE_API_KEY_OPENAI_AU_NEWSOUTHWALES: AZURE_API_KEY_OPENAI_AU_NEWSOUTHWALES!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_BR_SAOPAULOSTATE: AZURE_API_KEY_OPENAI_BR_SAOPAULOSTATE!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_CA_QUEBEC: AZURE_API_KEY_OPENAI_CA_QUEBEC!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_CA_TORONTO: AZURE_API_KEY_OPENAI_CA_TORONTO!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_CH_GENEVA: AZURE_API_KEY_OPENAI_CH_GENEVA!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_CH_ZURICH: AZURE_API_KEY_OPENAI_CH_ZURICH!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_EU_FRANKFURT: AZURE_API_KEY_OPENAI_EU_FRANKFURT!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_EU_GAVLE: AZURE_API_KEY_OPENAI_EU_GAVLE!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_EU_MADRID: AZURE_API_KEY_OPENAI_EU_MADRID!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_EU_NETHERLANDS: AZURE_API_KEY_OPENAI_EU_NETHERLANDS!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_EU_PARIS: AZURE_API_KEY_OPENAI_EU_PARIS!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_EU_WARSAW: AZURE_API_KEY_OPENAI_EU_WARSAW!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_IN_CHENNAI: AZURE_API_KEY_OPENAI_IN_CHENNAI!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_JP_TOKYO: AZURE_API_KEY_OPENAI_JP_TOKYO!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_KR_SEOUL: AZURE_API_KEY_OPENAI_KR_SEOUL!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_NO_OSLO: AZURE_API_KEY_OPENAI_NO_OSLO!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_UK_LONDON: AZURE_API_KEY_OPENAI_UK_LONDON!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_US_CALIFORNIA: AZURE_API_KEY_OPENAI_US_CALIFORNIA!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_US_ILLINOIS: AZURE_API_KEY_OPENAI_US_ILLINOIS!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_US_PHOENIX: AZURE_API_KEY_OPENAI_US_PHOENIX!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_US_TEXAS: AZURE_API_KEY_OPENAI_US_TEXAS!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_US_VIRGINIA: AZURE_API_KEY_OPENAI_US_VIRGINIA!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_US_VIRGINIA2: AZURE_API_KEY_OPENAI_US_VIRGINIA2!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_ZA_JOHANNESBURG: AZURE_API_KEY_OPENAI_ZA_JOHANNESBURG!.replaceAll(`"`, ``),
					},
				},
				workersAi: {
					apiToken: WORKERS_AI_API_KEY!.replaceAll(`"`, ``),
				},
				anthropic: {
					apiToken: ANTHROPIC_API_KEY!.replaceAll(`"`, ``) as ConstructorParameters<typeof SuperAi>[1]['anthropic']['apiToken'],
				},
			},
		);
	});

	afterEach(async () => {
		await Promise.all(waitUntilPromises);
	});

	for (const stream of [true, false]) {
		for (const llmProviderKey of allLlmProviderKeys) {
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
	const extraOverrideTest: aiProviders[] = [];
	const allLlmProviderKeys = [...Object.values(enabledAzureLlmProviders), ...enabledCloudflareLlmFunctionProviders, ...extraOverrideTest];
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
					apiToken: AI_GATEWAY_API_KEY!.replaceAll(`"`, ``),
				},
				openAi: {
					apiToken: OPENAI_API_KEY!.replaceAll(`"`, ``) as ConstructorParameters<typeof SuperAi>[1]['openAi']['apiToken'],
					organization: OPENAI_ORGANIZATION!.replaceAll(`"`, ``) as ConstructorParameters<typeof SuperAi>[1]['openAi']['organization'],
				},
				azureOpenAi: {
					apiTokens: {
						AZURE_API_KEY_OPENAI_AU_NEWSOUTHWALES: AZURE_API_KEY_OPENAI_AU_NEWSOUTHWALES!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_BR_SAOPAULOSTATE: AZURE_API_KEY_OPENAI_BR_SAOPAULOSTATE!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_CA_QUEBEC: AZURE_API_KEY_OPENAI_CA_QUEBEC!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_CA_TORONTO: AZURE_API_KEY_OPENAI_CA_TORONTO!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_CH_GENEVA: AZURE_API_KEY_OPENAI_CH_GENEVA!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_CH_ZURICH: AZURE_API_KEY_OPENAI_CH_ZURICH!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_EU_FRANKFURT: AZURE_API_KEY_OPENAI_EU_FRANKFURT!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_EU_GAVLE: AZURE_API_KEY_OPENAI_EU_GAVLE!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_EU_MADRID: AZURE_API_KEY_OPENAI_EU_MADRID!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_EU_NETHERLANDS: AZURE_API_KEY_OPENAI_EU_NETHERLANDS!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_EU_PARIS: AZURE_API_KEY_OPENAI_EU_PARIS!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_EU_WARSAW: AZURE_API_KEY_OPENAI_EU_WARSAW!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_IN_CHENNAI: AZURE_API_KEY_OPENAI_IN_CHENNAI!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_JP_TOKYO: AZURE_API_KEY_OPENAI_JP_TOKYO!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_KR_SEOUL: AZURE_API_KEY_OPENAI_KR_SEOUL!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_NO_OSLO: AZURE_API_KEY_OPENAI_NO_OSLO!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_UK_LONDON: AZURE_API_KEY_OPENAI_UK_LONDON!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_US_CALIFORNIA: AZURE_API_KEY_OPENAI_US_CALIFORNIA!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_US_ILLINOIS: AZURE_API_KEY_OPENAI_US_ILLINOIS!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_US_PHOENIX: AZURE_API_KEY_OPENAI_US_PHOENIX!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_US_TEXAS: AZURE_API_KEY_OPENAI_US_TEXAS!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_US_VIRGINIA: AZURE_API_KEY_OPENAI_US_VIRGINIA!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_US_VIRGINIA2: AZURE_API_KEY_OPENAI_US_VIRGINIA2!.replaceAll(`"`, ``),
						AZURE_API_KEY_OPENAI_ZA_JOHANNESBURG: AZURE_API_KEY_OPENAI_ZA_JOHANNESBURG!.replaceAll(`"`, ``),
					},
				},
				workersAi: {
					apiToken: WORKERS_AI_API_KEY!.replaceAll(`"`, ``),
				},
				anthropic: {
					apiToken: ANTHROPIC_API_KEY!.replaceAll(`"`, ``) as ConstructorParameters<typeof SuperAi>[1]['anthropic']['apiToken'],
				},
			},
		);
	});

	afterEach(async () => {
		await Promise.all(waitUntilPromises);
	});

	for (const stream of [true, false]) {
		for (const llmProviderKey of allLlmProviderKeys) {
			const settings: llmRequestProperties = { stream, max_tokens: 128 };

			void test(JSON.stringify({ model: llmProviderKey, ...settings }), async () => {
				const response = await superAi.llm({
					providerPreferences: [{ [llmProviderKey]: 1 }] as llmProviders<aiFunctionProviders>[],
					messages: [
						{
							role: 'user',
							content: 'Where am I running?',
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
						},
					],
					schema: {
						description: 'Return the current city and state of the runner',
						parameters: {
							type: 'object',
							properties: {
								city: { type: 'string' },
								state: { type: 'string' },
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
