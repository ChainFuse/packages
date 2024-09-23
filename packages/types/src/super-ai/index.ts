import type { JSONSchema7 } from 'json-schema';

export interface Coordinate {
	lat: number;
	lon: number;
}

type ToolJsonSchemaDefinition = ToolJsonSchema | boolean;
export interface ToolJsonSchema extends Omit<JSONSchema7, '$id' | '$ref' | '$schema' | '$defs' | 'title' | 'readOnly' | 'writeOnly'> {
	properties?: Record<string, ToolJsonSchemaDefinition>;
}
export interface ToolJsonRoot extends Omit<ToolJsonSchema, 'type'> {
	type: 'object';
}

export enum enabledAzureLlmProviders {
	Azure_OpenAi_Gpt3 = 'azure_openai_gpt3',
	Azure_OpenAi_Gpt4o_mini = 'azure_openai_gpt4o_mini',
	Azure_OpenAi_Gpt4 = 'azure_openai_gpt4',
	Azure_OpenAi_Gpt4o = 'azure_openai_gpt4o',
}
export enum enabledAzureLlmEmbeddingProviders {
	Azure_OpenAi_Embed3_Large = 'azure_openai_embed3_large',
	Azure_OpenAi_Embed3_Small = 'azure_openai_embed3_small',
}
