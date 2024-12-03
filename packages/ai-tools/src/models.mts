import type { Experimental_LanguageModelV1Middleware as LanguageModelV1Middleware } from 'ai';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { AiBase } from './base.mjs';

export class AiProviders extends AiBase {
	/**
	 * @todo @demosjarco Take model enum instead and pick the right one from the providers. Also take args in here and keep for logging in middleware.
	 */
	public wrappedLanguageModel(model: Parameters<typeof wrapLanguageModel>[0]['model']) {
		return wrapLanguageModel({
			model,
			middleware: this.middleware,
		});
	}

	private get middleware(): LanguageModelV1Middleware {
		return {};
	}
}
