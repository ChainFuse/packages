import { AiBase } from './base.mjs';
import type { AiRequestConfig } from './types.mjs';

export class AiRegistry extends AiBase {
	public providers(args: AiRequestConfig) {
		return import('./providers/customProviders.mjs').then(async ({ AiCustomProviders }) => ({
			openai: await new AiCustomProviders(this.config).oaiOpenai(args),
			azure: await new AiCustomProviders(this.config).azOpenai(args),
			anthropic: await new AiCustomProviders(this.config).anthropic(args),
			custom: await new AiCustomProviders(this.config).custom(args),
			'google.generative-ai': await new AiCustomProviders(this.config).googleAi(args),
			workersai: await new AiCustomProviders(this.config).workersAi(args),
		}));
	}

	public registry(args: AiRequestConfig) {
		return import('ai').then(async ({ createProviderRegistry }) => createProviderRegistry(await this.providers(args)));
	}
}
