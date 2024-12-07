import { experimental_customProvider as customProvider } from 'ai';
import { AiBase } from './base.mjs';
import { AiRawProviders } from './rawProviders.mjs';
import type { AiRequestConfig } from './types.mjs';

export class AiCustomProviders extends AiBase {
	public oaiOpenai(args: AiRequestConfig) {
		return new AiRawProviders(this.config).oaiOpenai(args);
	}

	public async azOpenai() {
		return customProvider({});
	}
}
