export const azureCatalog = [
	{
		id: 'OpenAi-AE-Dubai',
		coordinate: {
			lat: '25.266666',
			lon: '55.316666',
		},
		languageModelAvailability: [
			{
				name: 'gpt-4-turbo',
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: [],
	},
	{
		id: 'OpenAi-AU-NewSouthWales',
		coordinate: {
			lat: '-33.86',
			lon: '151.2094',
		},
		privacyRegion: 'APPs',
		languageModelAvailability: [
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-35-turbo',
				inputTokenCost: 5e-7,
				outputTokenCost: 0.0000015,
			},
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
		],
		imageModelAvailability: ['dall-e-3'],
		textEmbeddingModelAvailability: ['text-embedding-3-large', 'text-embedding-3-small'],
	},
	{
		id: 'OpenAi-BR-SaoPauloState',
		coordinate: {
			lat: '-23.55',
			lon: '-46.633',
		},
		privacyRegion: 'LGPD',
		languageModelAvailability: [
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: [],
	},
	{
		id: 'OpenAI-CA-Quebec',
		coordinate: {
			lat: '46.817',
			lon: '-71.217',
		},
		privacyRegion: 'PIPEDA',
		languageModelAvailability: [
			{
				name: 'gpt-35-turbo',
				inputTokenCost: 5e-7,
				outputTokenCost: 0.0000015,
			},
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: ['text-embedding-3-small', 'text-embedding-3-large'],
	},
	{
		id: 'OpenAI-CA-Toronto',
		coordinate: {
			lat: '43.653',
			lon: '-79.383',
		},
		privacyRegion: 'PIPEDA',
		languageModelAvailability: [],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: [],
	},
	{
		id: 'OpenAi-CH-Geneva',
		coordinate: {
			lat: '46.204391',
			lon: '6.143158',
		},
		privacyRegion: 'revFADP',
		languageModelAvailability: [],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: [],
	},
	{
		id: 'OpenAi-CH-Zurich',
		coordinate: {
			lat: '47.451542',
			lon: '8.564572',
		},
		privacyRegion: 'revFADP',
		languageModelAvailability: [
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
			{
				name: 'gpt-35-turbo',
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: ['text-embedding-3-large', 'text-embedding-3-small'],
	},
	{
		id: 'OpenAi-EU-Frankfurt',
		coordinate: {
			lat: '50.110924',
			lon: '8.682127',
		},
		privacyRegion: 'GDPR',
		languageModelAvailability: [
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'gpt-4-turbo',
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: [],
	},
	{
		id: 'OpenAi-EU-Gavle',
		coordinate: {
			lat: '60.67488',
			lon: '17.14127',
		},
		privacyRegion: 'GDPR',
		languageModelAvailability: [
			{
				name: 'gpt-35-turbo',
				inputTokenCost: 0.000001,
				outputTokenCost: 0.000002,
			},
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.65e-7,
				outputTokenCost: 6.6e-7,
			},
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'o1',
				inputTokenCost: 0.000015,
				outputTokenCost: 0.00005999999999999999,
			},
			{
				name: 'o3-mini',
				inputTokenCost: 0.0000011,
				outputTokenCost: 0.0000044,
			},
		],
		imageModelAvailability: ['dall-e-3'],
		textEmbeddingModelAvailability: ['text-embedding-3-large'],
	},
	{
		id: 'OpenAI-EU-Madrid',
		coordinate: {
			lat: '40.4259',
			lon: '3.4209',
		},
		privacyRegion: 'GDPR',
		languageModelAvailability: [
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: [],
	},
	{
		id: 'OpenAi-EU-Netherlands',
		coordinate: {
			lat: '52.3667',
			lon: '4.9',
		},
		privacyRegion: 'GDPR',
		languageModelAvailability: [
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: [],
	},
	{
		id: 'OpenAi-EU-Paris',
		coordinate: {
			lat: '46.3772',
			lon: '2.373',
		},
		privacyRegion: 'GDPR',
		languageModelAvailability: [
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'gpt-35-turbo',
				inputTokenCost: 0.000001,
				outputTokenCost: 0.000002,
			},
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: ['text-embedding-3-large'],
	},
	{
		id: 'OpenAi-EU-Warsaw',
		coordinate: {
			lat: '52.23334',
			lon: '21.01666',
		},
		privacyRegion: 'GDPR',
		languageModelAvailability: [
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'gpt-4-turbo',
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: ['text-embedding-3-large'],
	},
	{
		id: 'OpenAi-IN-Chennai',
		coordinate: {
			lat: '12.9822',
			lon: '80.1636',
		},
		privacyRegion: 'PDP',
		languageModelAvailability: [
			{
				name: 'gpt-35-turbo',
			},
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: ['text-embedding-3-large'],
	},
	{
		id: 'OpenAi-JP-Tokyo',
		coordinate: {
			lat: '35.68',
			lon: '139.77',
		},
		privacyRegion: 'APPI',
		languageModelAvailability: [
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
			{
				name: 'gpt-35-turbo',
				inputTokenCost: 5e-7,
				outputTokenCost: 0.0000015,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: ['text-embedding-3-large', 'text-embedding-3-small'],
	},
	{
		id: 'OpenAi-KR-Seoul',
		coordinate: {
			lat: '37.5665',
			lon: '126.978',
		},
		privacyRegion: 'PIPA',
		languageModelAvailability: [
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'gpt-4-turbo',
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: [],
	},
	{
		id: 'OpenAi-NO-Oslo',
		coordinate: {
			lat: '59.913868',
			lon: '10.752245',
		},
		privacyRegion: 'NPDA',
		languageModelAvailability: [
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: ['text-embedding-3-large'],
	},
	{
		id: 'OpenAi-SG-Singapore',
		coordinate: {
			lat: '1.283',
			lon: '103.833',
		},
		languageModelAvailability: [],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: [],
	},
	{
		id: 'OpenAi-UK-London',
		coordinate: {
			lat: '50.941',
			lon: '-0.799',
		},
		privacyRegion: 'UK-GDPR',
		languageModelAvailability: [
			{
				name: 'gpt-35-turbo',
				inputTokenCost: 5e-7,
				outputTokenCost: 0.0000015,
			},
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: ['text-embedding-3-large'],
	},
	{
		id: 'OpenAi-US-California',
		coordinate: {
			lat: '37.783',
			lon: '-122.417',
		},
		languageModelAvailability: [
			{
				name: 'gpt-35-turbo',
			},
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.65e-7,
				outputTokenCost: 6.6e-7,
			},
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: [],
	},
	{
		id: 'OpenAi-US-Illinois',
		coordinate: {
			lat: '41.8819',
			lon: '-87.6278',
		},
		languageModelAvailability: [
			{
				name: 'gpt-35-turbo',
				inputTokenCost: 5e-7,
				outputTokenCost: 0.0000015,
			},
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.65e-7,
				outputTokenCost: 6.6e-7,
			},
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: [],
	},
	{
		id: 'OpenAi-US-Phoenix',
		coordinate: {
			lat: '33.448376',
			lon: '-112.074036',
		},
		languageModelAvailability: [
			{
				name: 'gpt-4-turbo',
			},
			{
				name: 'gpt-35-turbo',
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.65e-7,
				outputTokenCost: 6.6e-7,
			},
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: ['text-embedding-3-large'],
	},
	{
		id: 'OpenAi-US-Texas',
		coordinate: {
			lat: '29.4167',
			lon: '-98.5',
		},
		languageModelAvailability: [
			{
				name: 'gpt-35-turbo',
				inputTokenCost: 5e-7,
				outputTokenCost: 0.0000015,
			},
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.65e-7,
				outputTokenCost: 6.6e-7,
			},
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: [],
	},
	{
		id: 'OpenAi-US-Virginia',
		coordinate: {
			lat: '37.3719',
			lon: '-79.8164',
		},
		languageModelAvailability: [
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-35-turbo',
				inputTokenCost: 5e-7,
				outputTokenCost: 0.0000015,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.65e-7,
				outputTokenCost: 6.6e-7,
			},
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
		],
		imageModelAvailability: ['dall-e-3'],
		textEmbeddingModelAvailability: ['text-embedding-3-small', 'text-embedding-3-large'],
	},
	{
		id: 'OpenAi-US-Virginia2',
		coordinate: {
			lat: '36.6681',
			lon: '-78.3889',
		},
		languageModelAvailability: [
			{
				name: 'gpt-4-turbo',
				inputTokenCost: 0.00001,
				outputTokenCost: 0.00003,
			},
			{
				name: 'gpt-35-turbo',
				inputTokenCost: 5e-7,
				outputTokenCost: 0.0000015,
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.65e-7,
				outputTokenCost: 6.6e-7,
			},
			{
				name: 'o1',
				inputTokenCost: 0.000015,
				outputTokenCost: 0.00005999999999999999,
			},
			{
				name: 'o3-mini',
				inputTokenCost: 0.0000011,
				outputTokenCost: 0.0000044,
			},
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: ['text-embedding-3-large', 'text-embedding-3-small'],
	},
	{
		id: 'OpenAi-ZA-Johannesburg',
		coordinate: {
			lat: '-25.73134',
			lon: '28.21837',
		},
		privacyRegion: 'PoPIA',
		languageModelAvailability: [
			{
				name: 'gpt-4o',
				inputTokenCost: 0.0000025,
				outputTokenCost: 0.00001,
			},
			{
				name: 'gpt-4-turbo',
			},
			{
				name: 'gpt-4o-mini',
				inputTokenCost: 1.5e-7,
				outputTokenCost: 6e-7,
			},
		],
		imageModelAvailability: [],
		textEmbeddingModelAvailability: [],
	},
] as const;
