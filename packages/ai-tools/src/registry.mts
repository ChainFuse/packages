import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';
import { AiBase } from './base.mjs';
import { AiCustomProviders } from './customProviders.mjs';
import type { AiRequestConfig } from './types.mjs';

export class AiRegistry extends AiBase {
	public async providers(args: AiRequestConfig) {
		return Object.freeze({
			openai: await new AiCustomProviders(this.config).oaiOpenai(args),
		});
	}

	public async registry(args: AiRequestConfig) {
		return createProviderRegistry(await this.providers(args));
	}
}
