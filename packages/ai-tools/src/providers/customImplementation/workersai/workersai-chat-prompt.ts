import type { RoleScopedChatInput } from '@cloudflare/workers-types/experimental';

export type WorkersAiChatPrompt = WorkersAiChatMessage[];

export type WorkersAiChatMessage = WorkersAiSystemMessage | WorkersAiUserMessage | WorkersAiAssistantMessage | WorkersAiToolMessage;

export interface WorkersAiSystemMessage extends Omit<RoleScopedChatInput, 'role'> {
	role: 'system';
}

export interface WorkersAiUserMessage extends Omit<RoleScopedChatInput, 'role'> {
	role: 'user';
}

export interface WorkersAiAssistantMessage extends Omit<RoleScopedChatInput, 'role'> {
	role: 'assistant';
	tool_calls?: {
		id: string;
		type: 'function';
		function: { name: string; arguments: string };
	}[];
}

export interface WorkersAiToolMessage extends Omit<RoleScopedChatInput, 'role'> {
	role: 'tool';
	name: string;
}
