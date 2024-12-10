import type { BaseAiSummarization, BaseAiTextEmbeddings, BaseAiTextGeneration } from '@cloudflare/workers-types/experimental';

export type WorkersAiChatSettings = Omit<BaseAiTextGeneration['inputs'], 'prompt' | 'messages' | 'tools'>;
export type WorkersAiSummarizationSettings = Omit<BaseAiSummarization['inputs'], 'input_text'>;
export type WorkersAiEmbeddingSettings = Omit<BaseAiTextEmbeddings['inputs'], 'text'>;
