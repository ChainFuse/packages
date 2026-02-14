import { AiModels, type LanguageModelValues } from '@chainfuse/types/ai-tools';
import type { IncomingRequestCfProperties } from '@cloudflare/workers-types/experimental';
import { generateText, Output, stepCountIs, streamText, tool, ToolLoopAgent } from 'ai';
import { doesNotReject, ok, strictEqual } from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test, { before, beforeEach, describe, it } from 'node:test';
import * as z4 from 'zod/v4';
import { AiModel, type AiConfig, type AiConfigOaiOpenai, type AiRequestConfig, type AiStreamChunkType } from '../dist/index.mjs';

const { GH_RUNNER_ID } = process.env;
const { CF_ACCOUNT_ID, AI_GATEWAY_API_KEY } = process.env;
const { AZURE_API_KEY_OPENAI_AE_DUBAI, AZURE_API_KEY_OPENAI_AU_NEWSOUTHWALES, AZURE_API_KEY_OPENAI_BR_SAOPAULOSTATE, AZURE_API_KEY_OPENAI_CA_QUEBEC, AZURE_API_KEY_OPENAI_CA_TORONTO, AZURE_API_KEY_OPENAI_CH_GENEVA, AZURE_API_KEY_OPENAI_CH_ZURICH, AZURE_API_KEY_OPENAI_EU_FRANKFURT, AZURE_API_KEY_OPENAI_EU_GAVLE, AZURE_API_KEY_OPENAI_EU_MADRID, AZURE_API_KEY_OPENAI_EU_MILAN, AZURE_API_KEY_OPENAI_EU_NETHERLANDS, AZURE_API_KEY_OPENAI_EU_PARIS, AZURE_API_KEY_OPENAI_EU_WARSAW, AZURE_API_KEY_OPENAI_IN_CHENNAI, AZURE_API_KEY_OPENAI_JP_TOKYO, AZURE_API_KEY_OPENAI_KR_SEOUL, AZURE_API_KEY_OPENAI_NO_OSLO, AZURE_API_KEY_OPENAI_SG_SINGAPORE, AZURE_API_KEY_OPENAI_UK_LONDON, AZURE_API_KEY_OPENAI_US_CALIFORNIA, AZURE_API_KEY_OPENAI_US_ILLINOIS, AZURE_API_KEY_OPENAI_US_IOWA, AZURE_API_KEY_OPENAI_US_PHOENIX, AZURE_API_KEY_OPENAI_US_TEXAS, AZURE_API_KEY_OPENAI_US_VIRGINIA, AZURE_API_KEY_OPENAI_US_VIRGINIA2, AZURE_API_KEY_OPENAI_ZA_JOHANNESBURG } = process.env;
const { GOOGLE_AI_API_KEY } = process.env;
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
			billing: {
				noCost: true,
			},
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
						AZURE_API_KEY_OPENAI_EU_MILAN: AZURE_API_KEY_OPENAI_EU_MILAN!.replaceAll(`"`, ``),
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
						AZURE_API_KEY_OPENAI_US_IOWA: AZURE_API_KEY_OPENAI_US_IOWA!.replaceAll(`"`, ``),
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
						const result = streamText({
							model: await new AiModel(config).wrappedLanguageModel(args, model as LanguageModelValues),
							messages: [
								{
									role: 'user',
									content: 'In a short sentence, tell me about black holes',
								},
							],
							maxOutputTokens: 128,
						});

						for await (const chunk of result.textStream) {
							strictEqual(typeof chunk, 'string');

							// console.debug('textPart', chunk);
						}

						await doesNotReject((async () => result.text)());
						strictEqual(typeof (await result.text), 'string');
						ok((await result.text).trim().length > 0);

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
									content: 'In a short sentence, tell me about black holes',
								},
							],
							maxOutputTokens: 128,
						});

						await doesNotReject(responsePromise);
						strictEqual(typeof (await responsePromise).text, 'string');
						ok((await responsePromise).text.trim().length > 0);

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
							const result = streamText({
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
								maxOutputTokens: 128,
								output: Output.object({
									schema: z4.object({
										city: z4.string().trim().describe('City of the incoming request'),
										state: z4.string().trim().describe('The ISO 3166-2 name for the first level region of the incoming request'),
									}),
									description: 'Return the current city and state of the runner',
								}),
							});

							let accumulatedOutput: AiStreamChunkType<(typeof result)['partialOutputStream']> = {};

							for await (const chunk of result.partialOutputStream) {
								strictEqual(typeof chunk, 'object');

								if (chunk.city) strictEqual(typeof chunk.city, 'string');
								if (chunk.state) strictEqual(typeof chunk.state, 'string');

								// console.debug('objectPart', 'Structured', 'Buffered', model, chunk);

								accumulatedOutput = { ...accumulatedOutput, ...chunk };
							}

							await doesNotReject((async () => result.output)());
							strictEqual(JSON.stringify(accumulatedOutput), JSON.stringify(await result.output));

							strictEqual(typeof (await result.output).city, 'string');
							ok((await result.output).city.trim().length > 0);
							strictEqual(typeof (await result.output).state, 'string');
							ok((await result.output).state.trim().length > 0);

							// console.debug('fullObject', 'Structured', 'Streaming', model, await result.output);
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
							const responsePromise = generateText({
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
								maxOutputTokens: 128,
								output: Output.object({
									schema: z4.object({
										city: z4.string().describe('City of the incoming request'),
										state: z4.string().describe('The ISO 3166-2 name for the first level region of the incoming request'),
									}),
									description: 'Return the current city and state of the runner',
								}),
							});

							await doesNotReject(responsePromise);

							const { output } = await responsePromise;
							strictEqual(typeof output.city, 'string');
							ok(output.city.trim().length > 0);
							strictEqual(typeof output.state, 'string');
							ok(output.state.trim().length > 0);

							console.debug('fulloutput', 'Structured', 'Buffered', model, output);
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
							const result = new ToolLoopAgent({
								model: await new AiModel(config).wrappedLanguageModel(args, model as LanguageModelValues),
								maxOutputTokens: 128,
								tools: {
									'get-container-info': tool({
										description: 'Get external statistics of the current container including geographical information',
										inputSchema: z4.object({}),
										strict: true,
										// eslint-disable-next-line @typescript-eslint/require-await
										execute: async () => geoJson,
									}),
								},
								stopWhen: stepCountIs(20),
								output: Output.object({
									schema: z4.object({
										city: z4.string().describe('City of the incoming request'),
										state: z4.string().describe('The ISO 3166-2 name for the first level region of the incoming request'),
									}),
								}),
							}).stream({
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
							});

							await doesNotReject((async () => result)());

							let accumulatedOutput: AiStreamChunkType<Awaited<typeof result>['partialOutputStream']> = {};

							for await (const chunk of (await result).partialOutputStream) {
								strictEqual(typeof chunk, 'object');

								if (chunk.city) strictEqual(typeof chunk.city, 'string');
								if (chunk.state) strictEqual(typeof chunk.state, 'string');

								// console.debug('objectPart', 'Structured with tools', 'Streaming', chunk);

								accumulatedOutput = { ...accumulatedOutput, ...chunk };
							}

							await doesNotReject((async () => (await result).output)());
							strictEqual(JSON.stringify(accumulatedOutput), JSON.stringify(await (await result).output));

							strictEqual(typeof (await (await result).output).city, 'string');
							strictEqual(typeof (await (await result).output).state, 'string');

							// console.debug('fullObject', 'Structured with tools', 'Streaming', await (await result).output);
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
							const responsePromise = new ToolLoopAgent({
								model: await new AiModel(config).wrappedLanguageModel(args, model as LanguageModelValues),
								maxOutputTokens: 128,
								tools: {
									'get-container-info': tool({
										description: 'Get external statistics of the current container including geographical information',
										inputSchema: z4.object({}),
										strict: true,
										// eslint-disable-next-line @typescript-eslint/require-await
										execute: async () => geoJson,
									}),
								},
								stopWhen: stepCountIs(20),
								output: Output.object({
									schema: z4.object({
										city: z4.string().describe('City of the incoming request'),
										state: z4.string().describe('The ISO 3166-2 name for the first level region of the incoming request'),
									}),
								}),
							}).generate({
								messages: [
									{
										role: 'system',
										content: 'You are an assistant running in a CI/CD test container running in a singular location for unit testing. Do not hallucinate the location, you must use the tool `get-container-info` to get external statistics of the container including geolocation information. Respond in json.',
									},
									{
										role: 'user',
										content: 'Where (geographically) are you running?',
									},
								],
							});

							await doesNotReject(responsePromise);

							const { output } = await responsePromise;
							strictEqual(typeof output.city, 'string');
							strictEqual(typeof output.state, 'string');

							// console.debug('fullObject', 'Structured with tools', 'Buffered', model, output);
						},
					);
				}
			}
		});
	});
});
