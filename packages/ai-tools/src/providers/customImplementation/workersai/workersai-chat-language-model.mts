import type { LanguageModelV1, LanguageModelV1CallWarning } from '@ai-sdk/provider';
import type { cloudflareModelPossibilities } from '@chainfuse/types';
import type { BaseAiTextGenerationModels } from '@cloudflare/workers-types/experimental';
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

	async doGenerate(options: Parameters<LanguageModelV1['doGenerate']>[0]): Promise<Awaited<ReturnType<LanguageModelV1['doGenerate']>>> {
		const { args, warnings } = this.getArgs(options);

		// Bypass types because model list will always be more updated
		const response = await this.config.binding.run(
			args.model as BaseAiTextGenerationModels,
			{
				stream: false,
				max_tokens: args.max_tokens,
				temperature: args.temperature,
				top_p: args.top_p,
				top_k: args.top_p,
				seed: args.seed,
				frequency_penalty: args.frequency_penalty,
				presence_penalty: args.presence_penalty,
				messages: args.messages,
			},
			{
				gateway: this.config.gateway,
				prefix: this.config.prefix,
				extraHeaders: this.config.extraHeaders,
			},
		);

		if (response instanceof ReadableStream) {
			throw new Error("This shouldn't happen");
		}

		temp;

		return {
			text: response.response,
			// TODO: tool calls
			toolCalls: response.tool_calls?.map((toolCall) => ({
				toolCallType: 'function',
				toolCallId: toolCall.name, // TODO: what can the id be?
				toolName: toolCall.name,
				args: JSON.stringify(toolCall.arguments || {}),
			})),
			finishReason: 'stop', // TODO: mapWorkersAIFinishReason(response.finish_reason),
			rawCall: { rawPrompt: args.messages, rawSettings: args },
			usage: {
				// TODO: mapWorkersAIUsage(response.usage),
				promptTokens: 0,
				completionTokens: 0,
			},
			warnings,
		};
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
