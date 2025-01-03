import { AiModels } from '@chainfuse/types';
import type { IncomingRequestCfProperties } from '@cloudflare/workers-types/experimental';
import { generateText, streamText } from 'ai';
import { doesNotReject, strictEqual } from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test, { before, beforeEach, describe, it } from 'node:test';
import { AiModel, type LanguageModelValues } from '../dist/models.mjs';
import type { AiConfig, AiConfigOaiOpenai, AiRequestConfig } from '../dist/types.mjs';

const { GH_RUNNER_ID } = process.env;
const { CF_ACCOUNT_ID, AI_GATEWAY_API_KEY } = process.env;
const { AZURE_API_KEY_OPENAI_AU_NEWSOUTHWALES, AZURE_API_KEY_OPENAI_BR_SAOPAULOSTATE, AZURE_API_KEY_OPENAI_CA_QUEBEC, AZURE_API_KEY_OPENAI_CA_TORONTO, AZURE_API_KEY_OPENAI_CH_GENEVA, AZURE_API_KEY_OPENAI_CH_ZURICH, AZURE_API_KEY_OPENAI_EU_FRANKFURT, AZURE_API_KEY_OPENAI_EU_GAVLE, AZURE_API_KEY_OPENAI_EU_MADRID, AZURE_API_KEY_OPENAI_EU_NETHERLANDS, AZURE_API_KEY_OPENAI_EU_PARIS, AZURE_API_KEY_OPENAI_EU_WARSAW, AZURE_API_KEY_OPENAI_IN_CHENNAI, AZURE_API_KEY_OPENAI_JP_TOKYO, AZURE_API_KEY_OPENAI_KR_SEOUL, AZURE_API_KEY_OPENAI_NO_OSLO, AZURE_API_KEY_OPENAI_UK_LONDON, AZURE_API_KEY_OPENAI_US_CALIFORNIA, AZURE_API_KEY_OPENAI_US_ILLINOIS, AZURE_API_KEY_OPENAI_US_PHOENIX, AZURE_API_KEY_OPENAI_US_TEXAS, AZURE_API_KEY_OPENAI_US_VIRGINIA, AZURE_API_KEY_OPENAI_US_VIRGINIA2, AZURE_API_KEY_OPENAI_ZA_JOHANNESBURG } = process.env;
const { OPENAI_ORGANIZATION } = process.env;
const { WORKERS_AI_API_KEY } = process.env;

await describe('AI Tests', () => {
	let config: AiConfig;
	let geoJson: IncomingRequestCfProperties;
	const args: AiRequestConfig = {
		dataspaceId: 'd_00000000-0000-0000-0000-000000000002_p',
		executor: {
			type: GH_RUNNER_ID ? 'githubCicd' : 'workflow',
			// CF Workflows have a uuidv4 instance id
			id: GH_RUNNER_ID ?? randomUUID(),
		},
	};

	before(async () => {
		geoJson = await fetch(new URL('https://workers.cloudflare.com/cf.json')).then((geoResponse) => geoResponse.json().then((json) => json as IncomingRequestCfProperties));
		config = {
			gateway: {
				accountId: CF_ACCOUNT_ID!,
				apiToken: AI_GATEWAY_API_KEY!,
			},
			geoRouting: {
				userCoordinate: {
					lat: geoJson.latitude!,
					lon: geoJson.longitude!,
				},
				country: geoJson.country,
				continent: geoJson.continent,
			},
			environment: 'preview',
			providers: {
				anthropic: {
					apiToken: 'sk-ant-*',
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
				openAi: {
					apiToken: 'sk-*',
					organization: OPENAI_ORGANIZATION as AiConfigOaiOpenai['organization'],
				},
				workersAi: {
					apiToken: WORKERS_AI_API_KEY!,
				},
			},
		};
	});

	void describe('Response', () => {
		const chosenModels = Object.entries(AiModels.LanguageModels)
			.filter(([provider]) => (['Azure', 'Cloudflare', 'CloudflareFunctions'] as (keyof typeof AiModels.LanguageModels)[]).includes(provider as keyof typeof AiModels.LanguageModels))
			.map(([, models]) => models);

		beforeEach(() => {
			// Simulate new instances each time
			args.executor.id = randomUUID();
		});

		void it('Streaming', async () => {
			for (const models of chosenModels) {
				for (const model of Object.values(models)) {
					await test(`${model}`, async () => {
						const { textStream, text } = streamText({
							model: await new AiModel(config).wrappedLanguageModel(args, model as LanguageModelValues),
							messages: [
								{
									role: 'user',
									content: 'Tell me about black holes',
								},
							],
							maxTokens: 128,
						});

						for await (const chunk of textStream) {
							strictEqual(typeof chunk, 'string');

							// console.debug('textPart', chunk);
						}

						await doesNotReject(text);
						strictEqual(typeof (await text), 'string');

						// console.debug('fullResponse', await text);
					});
				}
			}
		});

		void it('Buffered', async () => {
			for (const models of chosenModels) {
				for (const model of Object.values(models)) {
					await test(`${model}`, async () => {
						const responsePromise = generateText({
							model: await new AiModel(config).wrappedLanguageModel(args, model as LanguageModelValues),
							messages: [
								{
									role: 'user',
									content: 'Tell me about black holes',
								},
							],
							maxTokens: 128,
						});

						await doesNotReject(responsePromise);
						strictEqual(typeof (await responsePromise).text, 'string');

						// console.debug('fullResponse', (await responsePromise).text);
					});
				}
			}
		});
	});
});
