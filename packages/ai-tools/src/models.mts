import type { Experimental_LanguageModelV1Middleware as LanguageModelV1Middleware } from 'ai';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { AiBase } from './base.mjs';
import { AiRegistry } from './registry.mjs';
import type { AiRequestConfig } from './types.mjs';

type ProvidersReturnType = Awaited<ReturnType<AiRegistry['providers']>>;
type ValidProviders = keyof ProvidersReturnType;
type ProviderModels = {
	[P in ValidProviders]: Parameters<ProvidersReturnType[P]['languageModel']>[0];
};

export class AiModels extends AiBase {
	/**
	 * @todo @demosjarco Take model enum instead of string.
	 */
	public async wrappedLanguageModel<P extends ValidProviders>(config: AiRequestConfig, provider: P, model: ProviderModels[P]): Promise<ReturnType<typeof wrapLanguageModel>>;
	public async wrappedLanguageModel(config: AiRequestConfig, model: ''): Promise<ReturnType<typeof wrapLanguageModel>>;
	public async wrappedLanguageModel<P extends ValidProviders>(config: AiRequestConfig, modelOrProvider: string | P, model?: ProviderModels[P]) {
		return wrapLanguageModel({
			model: (await new AiRegistry(this.config).registry(config)).languageModel(model ? `${modelOrProvider}:${model}` : modelOrProvider),
			middleware: this.middleware,
		});
	}

	private get middleware(): LanguageModelV1Middleware {
		return {};
	}
}
