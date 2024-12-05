import type { OpenAIProvider } from '@ai-sdk/openai';
import { AiBase } from './base.mjs';
import { AiRawProviders } from './rawProviders.mjs';
import type { AiRequestConfig } from './types.mjs';

export class AiCustomProviders extends AiBase {
	public oaiOpenai(args: AiRequestConfig): Promise<OpenAIProvider> {
		return new AiRawProviders(this.config).oaiOpenai(args);
	}
}
