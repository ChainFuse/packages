import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';
import { AiBase } from './base.mjs';
import { AiCustomProviders } from './providers/customProviders.mjs';
import type { AiRequestConfig } from './types.mjs';

export class AiRegistry extends AiBase {
	public async providers(args: AiRequestConfig) {
		return Object.freeze({
			openai: await new AiCustomProviders(this.config).oaiOpenai(args),
			azure: await new AiCustomProviders(this.config).azOpenai(args),
			anthropic: await new AiCustomProviders(this.config).anthropic(args),
			custom: await new AiCustomProviders(this.config).custom(args),
			'google.generative-ai': await new AiCustomProviders(this.config).googleAi(args),
			workersai: await new AiCustomProviders(this.config).cfWorkersAi(args),
		});
	}

	public async registry(args: AiRequestConfig) {
		return createProviderRegistry(await this.providers(args));
	}
}
