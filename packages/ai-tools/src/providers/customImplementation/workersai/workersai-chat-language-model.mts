import type { LanguageModelV1, LanguageModelV1CallOptions, LanguageModelV1CallWarning, LanguageModelV1FinishReason, LanguageModelV1FunctionToolCall, LanguageModelV1LogProbs, LanguageModelV1ProviderMetadata, LanguageModelV1StreamPart } from '@ai-sdk/provider';
import type { cloudflareModelPossibilities } from '@chainfuse/types';
import { z } from 'zod';
import { convertToWorkersAiChatMessages } from './convert-to-workersai-chat-messages.mjs';
import type { WorkersAiSettings } from './index.mjs';
import type { WorkersAiChatSettings } from './workersai-chat-settings';

interface WorkersAIChatConfig extends WorkersAiSettings {
	provider: string;
}

export class WorkersAiChatLanguageModel implements LanguageModelV1 {
	readonly specificationVersion = 'v1';
	readonly defaultObjectGenerationMode = 'json';
	readonly supportsImageUrls = false;

	readonly modelId: cloudflareModelPossibilities<'Text Generation'>;
	readonly settings: WorkersAiChatSettings;

	private readonly config: WorkersAIChatConfig;

	constructor(modelId: cloudflareModelPossibilities<'Text Generation'>, settings: WorkersAiChatSettings, config: WorkersAIChatConfig) {
		this.modelId = modelId;
		this.settings = settings;
		this.config = config;
	}

	get provider(): string {
		return this.config.provider;
	}

	private getArgs({ mode, prompt, maxTokens, temperature, topP, topK, frequencyPenalty, presencePenalty, responseFormat, seed }: Parameters<LanguageModelV1['doGenerate']>[0]) {
		const type = mode.type;

		const warnings: LanguageModelV1CallWarning[] = [];

		if (responseFormat != null && responseFormat.type === 'json' && responseFormat.schema != null) {
			warnings.push({
				type: 'unsupported-setting',
				setting: 'responseFormat',
				details: 'JSON response format schema is not supported',
			});
		}

		const baseArgs = {
			// model id:
			model: this.modelId,

			// standardized settings:
			max_tokens: maxTokens,
			temperature,
			top_p: topP,
			top_k: topK,
			seed,
			frequency_penalty: frequencyPenalty,
			presence_penalty: presencePenalty,

			// response format:
			response_format: responseFormat?.type === 'json' ? { type: 'json_object' } : undefined,

			// messages:
			messages: convertToWorkersAiChatMessages(prompt),
		};

		switch (type) {
			case 'regular':
				return {
					args: { ...baseArgs, ...prepareToolsAndToolChoice(mode) },
					warnings,
				};
			case 'object-json':
				return {
					args: {
						...baseArgs,
						response_format: { type: 'json_object' },
					},
					warnings,
				};
			case 'object-tool':
				return {
					args: {
						...baseArgs,
						tool_choice: 'any',
						tools: [{ type: 'function', function: mode.tool }],
					},
					warnings,
				};

			default:
				const _exhaustiveCheck: never = type;
				throw new Error(`Unsupported type: ${_exhaustiveCheck}`);
		}
	}
}

// limited version of the schema, focussed on what is needed for the implementation
// this approach limits breakages when the API changes and increases efficiency
const mistralChatResponseSchema = z.object({
	id: z.string().nullish(),
	created: z.number().nullish(),
	model: z.string().nullish(),
	choices: z.array(
		z.object({
			message: z.object({
				role: z.literal('assistant'),
				content: z.string().nullable(),
				tool_calls: z
					.array(
						z.object({
							id: z.string(),
							function: z.object({ name: z.string(), arguments: z.string() }),
						}),
					)
					.nullish(),
			}),
			index: z.number(),
			finish_reason: z.string().nullish(),
		}),
	),
	object: z.literal('chat.completion'),
	usage: z.object({
		prompt_tokens: z.number(),
		completion_tokens: z.number(),
	}),
});

// limited version of the schema, focussed on what is needed for the implementation
// this approach limits breakages when the API changes and increases efficiency
const mistralChatChunkSchema = z.object({
	id: z.string().nullish(),
	created: z.number().nullish(),
	model: z.string().nullish(),
	choices: z.array(
		z.object({
			delta: z.object({
				role: z.enum(['assistant']).optional(),
				content: z.string().nullish(),
				tool_calls: z
					.array(
						z.object({
							id: z.string(),
							function: z.object({ name: z.string(), arguments: z.string() }),
						}),
					)
					.nullish(),
			}),
			finish_reason: z.string().nullish(),
			index: z.number(),
		}),
	),
	usage: z
		.object({
			prompt_tokens: z.number(),
			completion_tokens: z.number(),
		})
		.nullish(),
});

function prepareToolsAndToolChoice(
	mode: Parameters<LanguageModelV1['doGenerate']>[0]['mode'] & {
		type: 'regular';
	},
) {
	// when the tools array is empty, change it to undefined to prevent errors:
	const tools = mode.tools?.length ? mode.tools : undefined;

	if (tools == null) {
		return { tools: undefined, tool_choice: undefined };
	}

	const mappedTools = tools.map((tool) => ({
		type: 'function',
		function: {
			name: tool.name,
			description: tool.description,
			parameters: tool.parameters,
		},
	}));

	const toolChoice = mode.toolChoice;

	if (toolChoice == null) {
		return { tools: mappedTools, tool_choice: undefined };
	}

	const type = toolChoice.type;

	switch (type) {
		case 'auto':
			return { tools: mappedTools, tool_choice: type };
		case 'none':
			return { tools: mappedTools, tool_choice: type };
		case 'required':
			return { tools: mappedTools, tool_choice: 'any' };

		// workersAI does not support tool mode directly,
		// so we filter the tools and force the tool choice through 'any'
		case 'tool':
			return {
				tools: mappedTools.filter((tool) => tool.function.name === toolChoice.toolName),
				tool_choice: 'any',
			};
		default: {
			const exhaustiveCheck = type satisfies never;
			throw new Error(`Unsupported tool choice type: ${exhaustiveCheck}`);
		}
	}
}
