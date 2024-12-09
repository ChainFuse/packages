import type { LanguageModelV1Prompt } from '@ai-sdk/provider';
import { UnsupportedFunctionalityError } from '@ai-sdk/provider';
import type { WorkersAiChatPrompt } from './workersai-chat-prompt';

export function convertToWorkersAiChatMessages(prompt: LanguageModelV1Prompt): WorkersAiChatPrompt {
	const messages: WorkersAiChatPrompt = [];

	for (const { role, content } of prompt) {
		switch (role) {
			case 'system':
				messages.push({ role: 'system', content });
				break;

			case 'user':
				messages.push({
					role: 'user',
					content: content
						.map((part) => {
							switch (part.type) {
								case 'text':
									return part.text;

								default:
									throw new UnsupportedFunctionalityError({
										functionality: 'File content parts in user messages',
									});
							}
						})
						.join(''),
				});
				break;

			case 'assistant':
				let text = '';
				const toolCalls: {
					id: string;
					type: 'function';
					function: { name: string; arguments: string };
				}[] = [];

				for (const part of content) {
					switch (part.type) {
						case 'text':
							text += part.text;
							break;

						case 'tool-call':
							toolCalls.push({
								id: part.toolCallId,
								type: 'function',
								function: {
									name: part.toolName,
									arguments: JSON.stringify(part.args),
								},
							});
							break;

						default:
							const _exhaustiveCheck: never = part;
							throw new Error(`Unsupported part: ${_exhaustiveCheck}`);
					}
				}

				messages.push({
					role: 'assistant',
					content: text,
					tool_calls:
						toolCalls.length > 0
							? toolCalls.map(({ function: { name, arguments: args } }) => ({
									id: 'null',
									type: 'function',
									function: { name, arguments: args },
								}))
							: undefined,
				});

				break;

			case 'tool':
				for (const toolResponse of content) {
					messages.push({
						role: 'tool',
						name: toolResponse.toolName,
						content: JSON.stringify(toolResponse.result),
					});
				}
				break;

			default:
				const _exhaustiveCheck: never = role;
				throw new Error(`Unsupported role: ${_exhaustiveCheck}`);
		}
	}

	return messages;
}
