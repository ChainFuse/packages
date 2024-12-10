import { PrivacyRegion, ServerSelector } from './base.mjs';
import type { Server } from './types.mjs';

export class AzureServerSelector extends ServerSelector {
	// From: https://gist.github.com/demosjarco/2091b3a197e530f1402e9dfec6666cd8
	public override readonly servers = new Set<Server>([
		{
			id: 'OpenAi-AU-NewSouthWales',
			coordinate: {
				lat: -33.86,
				lon: 151.2094,
			},
			region: PrivacyRegion.Australian_Privacy_Principles,
			languageModelAvailability: ['gpt-35-turbo', 'gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: [],
		},
		{
			id: 'OpenAi-BR-SaoPauloState',
			coordinate: {
				lat: -23.55,
				lon: -46.633,
			},
			region: PrivacyRegion.Brazil_General_Data_protection_Law,
			languageModelAvailability: ['gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: [],
		},
		{
			id: 'OpenAI-CA-Toronto',
			coordinate: {
				lat: 43.653,
				lon: -79.383,
			},
			region: PrivacyRegion.Canada_Personal_Information_Protection_and_Electronic_Documents_Act,
			languageModelAvailability: [],
			textEmbeddingModelAvailability: [],
		},
		{
			id: 'OpenAI-CA-Quebec',
			coordinate: {
				lat: 46.817,
				lon: -71.217,
			},
			region: PrivacyRegion.Canada_Personal_Information_Protection_and_Electronic_Documents_Act,
			languageModelAvailability: ['gpt-35-turbo', 'gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: ['text-embedding-3-small', 'text-embedding-3-large'],
		},
		{
			id: 'OpenAi-US-Virginia',
			coordinate: {
				lat: 37.3719,
				lon: -79.8164,
			},
			languageModelAvailability: ['gpt-35-turbo', 'gpt-4-turbo', 'gpt-4o-mini', 'gpt-4o'],
			textEmbeddingModelAvailability: ['text-embedding-3-small', 'text-embedding-3-large'],
		},
		{
			id: 'OpenAi-US-Virginia2',
			coordinate: {
				lat: 36.6681,
				lon: -78.3889,
			},
			languageModelAvailability: ['gpt-35-turbo', 'gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: ['text-embedding-3-small', 'text-embedding-3-large'],
		},
		{
			id: 'OpenAi-EU-Paris',
			coordinate: {
				lat: 46.3772,
				lon: 2.373,
			},
			region: PrivacyRegion.General_Data_Protection_Regulation,
			languageModelAvailability: ['gpt-35-turbo', 'gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: ['text-embedding-3-large'],
		},
		{
			id: 'OpenAi-EU-Frankfurt',
			coordinate: {
				lat: 50.110924,
				lon: 8.682127,
			},
			region: PrivacyRegion.General_Data_Protection_Regulation,
			languageModelAvailability: ['gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: [],
		},
		{
			id: 'OpenAi-JP-Tokyo',
			coordinate: {
				lat: 35.68,
				lon: 139.77,
			},
			region: PrivacyRegion.Japan_Act_on_the_Protection_of_Personal_Information,
			languageModelAvailability: ['gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: ['text-embedding-3-large'],
		},
		{
			id: 'OpenAi-KR-Seoul',
			coordinate: {
				lat: 37.5665,
				lon: 126.978,
			},
			region: PrivacyRegion.Korean_Personal_Information_Protection_Act,
			languageModelAvailability: ['gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: [],
		},
		{
			id: 'OpenAi-US-Illinois',
			coordinate: {
				lat: 41.8819,
				lon: -87.6278,
			},
			languageModelAvailability: ['gpt-35-turbo', 'gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: [],
		},
		{
			id: 'OpenAi-NO-Oslo',
			coordinate: {
				lat: 59.913868,
				lon: 10.752245,
			},
			region: PrivacyRegion.Norwegian_Personal_Data_Act,
			languageModelAvailability: ['gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: ['text-embedding-3-large'],
		},
		{
			id: 'OpenAi-EU-Warsaw',
			coordinate: {
				lat: 52.23334,
				lon: 21.01666,
			},
			region: PrivacyRegion.General_Data_Protection_Regulation,
			languageModelAvailability: ['gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: [],
		},
		{
			id: 'OpenAi-ZA-Johannesburg',
			coordinate: {
				lat: 28.21837,
				lon: -25.73134,
			},
			region: PrivacyRegion.SouthAfrica_Protection_Personal_Information_Act,
			languageModelAvailability: ['gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: [],
		},
		{
			id: 'OpenAi-US-Texas',
			coordinate: {
				lat: 29.4167,
				lon: -98.5,
			},
			languageModelAvailability: ['gpt-35-turbo', 'gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: [],
		},
		{
			id: 'OpenAi-IN-Chennai',
			coordinate: {
				lat: 12.9822,
				lon: 80.1636,
			},
			region: PrivacyRegion.Indian_Personal_Protection,
			languageModelAvailability: ['gpt-35-turbo', 'gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: ['text-embedding-3-large'],
		},
		{
			id: 'OpenAi-EU-Gavle',
			coordinate: {
				lat: 60.67488,
				lon: 17.14127,
			},
			region: PrivacyRegion.General_Data_Protection_Regulation,
			languageModelAvailability: ['gpt-35-turbo', 'gpt-4-turbo', 'gpt-4o-mini', 'gpt-4o'],
			textEmbeddingModelAvailability: ['text-embedding-3-large'],
		},
		{
			id: 'OpenAi-EU-Madrid',
			coordinate: {
				lat: 3.4209,
				lon: 40.4259,
			},
			region: PrivacyRegion.General_Data_Protection_Regulation,
			languageModelAvailability: ['gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: [],
		},
		{
			id: 'OpenAi-CH-Geneva',
			coordinate: {
				lat: 46.204391,
				lon: 6.143158,
			},
			region: PrivacyRegion.Swiss_Federal_Act_on_Data_Protection,
			languageModelAvailability: [],
			textEmbeddingModelAvailability: [],
		},
		{
			id: 'OpenAi-CH-Zurich',
			coordinate: {
				lat: 47.451542,
				lon: 8.564572,
			},
			region: PrivacyRegion.Swiss_Federal_Act_on_Data_Protection,
			languageModelAvailability: ['gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: [],
		},
		{
			id: 'OpenAi-UK-London',
			coordinate: {
				lat: 50.941,
				lon: -0.799,
			},
			region: PrivacyRegion.UK_General_Data_Protection_Regulation,
			languageModelAvailability: ['gpt-35-turbo', 'gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: ['text-embedding-3-large'],
		},
		{
			id: 'OpenAi-EU-Netherlands',
			coordinate: {
				lat: 52.3667,
				lon: 4.9,
			},
			region: PrivacyRegion.General_Data_Protection_Regulation,
			languageModelAvailability: ['gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: [],
		},
		{
			id: 'OpenAi-US-California',
			coordinate: {
				lat: 37.783,
				lon: -122.417,
			},
			languageModelAvailability: ['gpt-35-turbo', 'gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: [],
		},
		{
			id: 'OpenAi-US-Phoenix',
			coordinate: {
				lat: 33.448376,
				lon: -112.074036,
			},
			languageModelAvailability: ['gpt-35-turbo', 'gpt-4-turbo', 'gpt-4o'],
			textEmbeddingModelAvailability: ['text-embedding-3-large'],
		},
	]);
}
