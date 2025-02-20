import { AiModels, type LanguageModelValues } from '@chainfuse/types';
import type { IncomingRequestCfProperties } from '@cloudflare/workers-types/experimental';
import { generateObject, generateText, Output, streamObject, streamText, tool } from 'ai';
import { doesNotReject, strictEqual } from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test, { before, beforeEach, describe, it } from 'node:test';
import { z } from 'zod';
import { AiModel, type AiConfig, type AiConfigOaiOpenai, type AiRequestConfig, type AiStreamChunkType } from '../dist/index.mjs';

const { GH_RUNNER_ID } = process.env;
const { CF_ACCOUNT_ID, AI_GATEWAY_API_KEY } = process.env;
const { AZURE_API_KEY_OPENAI_AE_DUBAI, AZURE_API_KEY_OPENAI_AU_NEWSOUTHWALES, AZURE_API_KEY_OPENAI_BR_SAOPAULOSTATE, AZURE_API_KEY_OPENAI_CA_QUEBEC, AZURE_API_KEY_OPENAI_CA_TORONTO, AZURE_API_KEY_OPENAI_CH_GENEVA, AZURE_API_KEY_OPENAI_CH_ZURICH, AZURE_API_KEY_OPENAI_EU_FRANKFURT, AZURE_API_KEY_OPENAI_EU_GAVLE, AZURE_API_KEY_OPENAI_EU_MADRID, AZURE_API_KEY_OPENAI_EU_NETHERLANDS, AZURE_API_KEY_OPENAI_EU_PARIS, AZURE_API_KEY_OPENAI_EU_WARSAW, AZURE_API_KEY_OPENAI_IN_CHENNAI, AZURE_API_KEY_OPENAI_JP_TOKYO, AZURE_API_KEY_OPENAI_KR_SEOUL, AZURE_API_KEY_OPENAI_NO_OSLO, AZURE_API_KEY_OPENAI_SG_SINGAPORE, AZURE_API_KEY_OPENAI_UK_LONDON, AZURE_API_KEY_OPENAI_US_CALIFORNIA, AZURE_API_KEY_OPENAI_US_ILLINOIS, AZURE_API_KEY_OPENAI_US_PHOENIX, AZURE_API_KEY_OPENAI_US_TEXAS, AZURE_API_KEY_OPENAI_US_VIRGINIA, AZURE_API_KEY_OPENAI_US_VIRGINIA2, AZURE_API_KEY_OPENAI_ZA_JOHANNESBURG } = process.env;
const { GOOGLE_AI_API_KEY } = process.env;
const { OPENAI_ORGANIZATION } = process.env;
const { WORKERS_AI_API_KEY } = process.env;

await describe('AI Tests', () => {
	let config: AiConfig;
	let geoJson: IncomingRequestCfProperties;
	const args: AiRequestConfig = {
		messageId: randomUUID(),
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
						AZURE_API_KEY_OPENAI_AE_DUBAI: AZURE_API_KEY_OPENAI_AE_DUBAI!.replaceAll(`"`, ``),
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
						AZURE_API_KEY_OPENAI_SG_SINGAPORE: AZURE_API_KEY_OPENAI_SG_SINGAPORE!.replaceAll(`"`, ``),
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
				googleAi: {
					apiToken: GOOGLE_AI_API_KEY!,
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
			.filter(([provider]) => (['Azure', 'Cloudflare', 'CloudflareFunctions', 'GoogleGenerativeAi'] as (keyof typeof AiModels.LanguageModels)[]).includes(provider as keyof typeof AiModels.LanguageModels))
			.map(([, models]) => models);

		beforeEach(() => {
			// Simulate new instances each time
			args.executor.id = randomUUID();
		});

		void it(['Response', 'Streaming'].join(' '), async () => {
			for (const models of chosenModels) {
				for (const model of Object.values(models)) {
					await test(['Response', 'Streaming', model].join(' '), async () => {
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

		void it(['Response', 'Buffered'].join(' '), async () => {
			for (const models of chosenModels) {
				for (const model of Object.values(models)) {
					await test(['Response', 'Buffered', model].join(' '), async () => {
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

	void describe('Structured', () => {
		const chosenModels = Object.entries(AiModels.LanguageModels)
			.filter(([provider]) => (['Azure', 'Cloudflare', 'CloudflareFunctions', 'GoogleGenerativeAi'] as (keyof typeof AiModels.LanguageModels)[]).includes(provider as keyof typeof AiModels.LanguageModels))
			.map(([, models]) => models);

		beforeEach(() => {
			// Simulate new instances each time
			args.executor.id = randomUUID();
		});

		void it(['Structured', 'Streaming'].join(' '), async () => {
			for (const models of chosenModels) {
				for (const model of Object.values(models)) {
					await test(
						['Structured', 'Streaming', model].join(' '),
						{
							// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
							todo: Object.values(AiModels.LanguageModels.Cloudflare).includes(model) || Object.values(AiModels.LanguageModels.CloudflareFunctions).includes(model),
						},
						async () => {
							const { partialObjectStream, object } = streamObject({
								model: await new AiModel(config).wrappedLanguageModel(args, model as LanguageModelValues),
								messages: [
									{
										role: 'system',
										content: `You are an assistant running in a CI/CD test container running in a singular location for unit testing. External statistics of the container:\`${JSON.stringify(geoJson)}\``,
									},
									{
										role: 'user',
										content: 'Where (geographically) are you running?',
									},
								],
								maxTokens: 128,
								schema: z.object({
									city: z.string().trim().describe('City of the incoming request'),
									state: z.string().trim().describe('The ISO 3166-2 name for the first level region of the incoming request'),
								}),
								schemaDescription: 'Return the current city and state of the runner',
							});

							for await (const chunk of partialObjectStream) {
								strictEqual(typeof chunk, 'object');

								if (chunk.city) strictEqual(typeof chunk.city, 'string');
								if (chunk.state) strictEqual(typeof chunk.state, 'string');

								// console.debug('objectPart', 'Structured', 'Buffered', model, chunk);
							}

							await doesNotReject(object);

							strictEqual(typeof (await object).city, 'string');
							strictEqual(typeof (await object).state, 'string');

							// console.debug('fullObject', 'Structured', 'Streaming', model, await object);
						},
					);
				}
			}
		});

		void it(['Structured', 'Buffered'].join(' '), async () => {
			for (const models of chosenModels) {
				for (const model of Object.values(models)) {
					await test(
						['Structured', 'Buffered', model].join(' '),
						{
							// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
							todo: Object.values(AiModels.LanguageModels.Cloudflare).includes(model) || Object.values(AiModels.LanguageModels.CloudflareFunctions).includes(model),
						},
						async () => {
							const responsePromise = generateObject({
								model: await new AiModel(config).wrappedLanguageModel(args, model as LanguageModelValues),
								messages: [
									{
										role: 'system',
										content: `You are an assistant running in a CI/CD test container running in a singular location for unit testing. External statistics of the container:\`${JSON.stringify(geoJson)}\``,
									},
									{
										role: 'user',
										content: 'Where (geographically) are you running?',
									},
								],
								maxTokens: 128,
								schema: z.object({
									city: z.string().describe('City of the incoming request'),
									state: z.string().describe('The ISO 3166-2 name for the first level region of the incoming request'),
								}),
								schemaDescription: 'Return the current city and state of the runner',
							});

							await doesNotReject(responsePromise);

							const { object } = await responsePromise;
							strictEqual(typeof object.city, 'string');
							strictEqual(typeof object.state, 'string');

							// console.debug('fullObject', 'Structured', 'Buffered', model, object);
						},
					);
				}
			}
		});
	});

	void describe('Structured with tools', () => {
		const chosenModels = Object.entries(AiModels.LanguageModels)
			.filter(([provider]) => (['Azure', 'Cloudflare', 'CloudflareFunctions', 'GoogleGenerativeAi'] as (keyof typeof AiModels.LanguageModels)[]).includes(provider as keyof typeof AiModels.LanguageModels))
			.map(([, models]) => models);

		beforeEach(() => {
			// Simulate new instances each time
			args.executor.id = randomUUID();
		});

		/**
		 * Listed in documentation but missing from code
		 * @link https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#streamtext
		 */
		void it(['Structured with tools', 'Streaming'].join(' '), async () => {
			for (const models of chosenModels) {
				for (const model of Object.values(models)) {
					await test(
						['Structured with tools', 'Streaming', model].join(' '),
						{
							// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
							todo: Object.values(AiModels.LanguageModels.Cloudflare).includes(model) || Object.values(AiModels.LanguageModels.CloudflareFunctions).includes(model),
						},
						async () => {
							const { experimental_partialOutputStream } = streamText({
								model: await new AiModel(config).wrappedLanguageModel(args, model as LanguageModelValues),
								messages: [
									{
										role: 'system',
										content: 'You are an assistant running in a CI/CD test container running in a singular location for unit testing. Use the tool `get-container-info` to get external statistics of the container including geolocation information. Respond in json.',
									},
									{
										role: 'user',
										content: 'Where (geographically) are you running?',
									},
								],
								maxTokens: 128,
								tools: {
									'get-container-info': tool({
										description: 'Get external statistics of the current container including geographical information',
										parameters: z.object({}),
										// eslint-disable-next-line @typescript-eslint/require-await
										execute: async () => geoJson,
									}),
								},
								toolChoice: 'required',
								experimental_output: Output.object({
									schema: z.object({
										city: z.string().describe('City of the incoming request'),
										state: z.string().describe('The ISO 3166-2 name for the first level region of the incoming request'),
									}),
								}),
							});

							let experimental_output: AiStreamChunkType<typeof experimental_partialOutputStream> = {};

							for await (const chunk of experimental_partialOutputStream) {
								strictEqual(typeof chunk, 'object');

								if (chunk.city) strictEqual(typeof chunk.city, 'string');
								if (chunk.state) strictEqual(typeof chunk.state, 'string');

								// console.debug('objectPart', 'Structured with tools', 'Streaming', chunk);

								experimental_output = { ...experimental_output, ...chunk };
							}

							/**
							 * Doesn't support accumulated output
							 * @link https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#streamtext
							 */
							// await doesNotReject(experimental_output);

							strictEqual(typeof experimental_output.city, 'string');
							strictEqual(typeof experimental_output.state, 'string');

							// console.debug('fullObject', 'Structured with tools', 'Streaming', experimental_output);
						},
					);
				}
			}
		});

		void it(['Structured with tools', 'Buffered'].join(' '), async () => {
			for (const models of chosenModels) {
				for (const model of Object.values(models)) {
					await test(
						['Structured with tools', 'Buffered', model].join(' '),
						{
							// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
							todo: Object.values(AiModels.LanguageModels.Cloudflare).includes(model) || Object.values(AiModels.LanguageModels.CloudflareFunctions).includes(model),
						},
						async () => {
							const responsePromise = generateText({
								model: await new AiModel(config).wrappedLanguageModel(args, model as LanguageModelValues),
								messages: [
									{
										role: 'system',
										content: 'You are an assistant running in a CI/CD test container running in a singular location for unit testing. Use the tool `get-container-info` to get external statistics of the container including geolocation information. Respond in json.',
									},
									{
										role: 'user',
										content: 'Where (geographically) are you running?',
									},
								],
								maxTokens: 128,
								tools: {
									'get-container-info': tool({
										description: 'Get external statistics of the current container including geographical information',
										parameters: z.object({}),
										// eslint-disable-next-line @typescript-eslint/require-await
										execute: async () => geoJson,
									}),
								},
								toolChoice: 'required',
								experimental_output: Output.object({
									schema: z.object({
										city: z.string().describe('City of the incoming request'),
										state: z.string().describe('The ISO 3166-2 name for the first level region of the incoming request'),
									}),
								}),
							});

							await doesNotReject(responsePromise);

							const { experimental_output } = await responsePromise;
							strictEqual(typeof experimental_output.city, 'string');
							strictEqual(typeof experimental_output.state, 'string');

							// console.debug('fullObject', 'Structured with tools', 'Buffered', model, experimental_output);
						},
					);
				}
			}
		});
	});
});
