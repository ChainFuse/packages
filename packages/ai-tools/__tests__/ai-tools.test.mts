import { BufferHelpers } from '@chainfuse/helpers';
import type { IncomingRequestCfProperties } from '@cloudflare/workers-types/experimental';
import { generateText } from 'ai';
import { describe } from 'node:test';
import { AiModel } from '../dist/models.mjs';
import type { AiConfig } from '../dist/types.mjs';

const { CF_ACCOUNT_ID, AI_GATEWAY_API_KEY } = process.env;

void describe('AI Tests', async () => {
const geoJson = await fetch(new URL('https://workers.cloudflare.com/cf.json')).then((geoResponse) => geoResponse.json().then((json) => json as IncomingRequestCfProperties));

	const config: AiConfig = {
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
					AZURE_API_KEY_OPENAI_AU_NEWSOUTHWALES: '',
					AZURE_API_KEY_OPENAI_BR_SAOPAULOSTATE: '',
					AZURE_API_KEY_OPENAI_CA_QUEBEC: '',
					AZURE_API_KEY_OPENAI_CA_TORONTO: '',
					AZURE_API_KEY_OPENAI_CH_GENEVA: '',
					AZURE_API_KEY_OPENAI_CH_ZURICH: '',
					AZURE_API_KEY_OPENAI_EU_FRANKFURT: '',
					AZURE_API_KEY_OPENAI_EU_GAVLE: '',
					AZURE_API_KEY_OPENAI_EU_MADRID: '',
					AZURE_API_KEY_OPENAI_EU_NETHERLANDS: '',
					AZURE_API_KEY_OPENAI_EU_PARIS: '',
					AZURE_API_KEY_OPENAI_EU_WARSAW: '',
					AZURE_API_KEY_OPENAI_IN_CHENNAI: '',
					AZURE_API_KEY_OPENAI_JP_TOKYO: '',
					AZURE_API_KEY_OPENAI_KR_SEOUL: '',
					AZURE_API_KEY_OPENAI_NO_OSLO: '',
					AZURE_API_KEY_OPENAI_UK_LONDON: '',
					AZURE_API_KEY_OPENAI_US_CALIFORNIA: '',
					AZURE_API_KEY_OPENAI_US_ILLINOIS: '',
					AZURE_API_KEY_OPENAI_US_PHOENIX: '',
					AZURE_API_KEY_OPENAI_US_TEXAS: '',
					AZURE_API_KEY_OPENAI_US_VIRGINIA: '',
					AZURE_API_KEY_OPENAI_US_VIRGINIA2: '',
					AZURE_API_KEY_OPENAI_ZA_JOHANNESBURG: '',
				},
			},
			openAi: {
				apiToken: 'sk-*',
				organization: 'org-*',
			},
			workersAi: {
				apiToken: '',
			},
		},
	};

	await generateText({
		model: await new AiModel(config).wrappedLanguageModel(
			{
				dataspaceId: (await BufferHelpers.generateUuid).utf8,
				executor: {
					type: 'workflow',
					id: '',
				},
			},
			'workersai',
			'@cf/meta/llama-3.2-11b-vision-instruct',
		),
		prompt: 'Ooga booga',
	});
});
