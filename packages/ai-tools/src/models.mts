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
	public wrappedLanguageModel<P extends ValidProviders>(args: AiRequestConfig, provider: P, model: ProviderModels[P]): Promise<ReturnType<typeof wrapLanguageModel>>;
	public wrappedLanguageModel(args: AiRequestConfig, model: ''): Promise<ReturnType<typeof wrapLanguageModel>>;
	public wrappedLanguageModel<P extends ValidProviders>(args: AiRequestConfig, modelOrProvider: string | P, model?: ProviderModels[P]) {
		return new AiRegistry(this.config).registry(args).then((registry) =>
			wrapLanguageModel({
				model: registry.languageModel(model ? `${modelOrProvider}:${model}` : modelOrProvider),
				middleware: this.middleware,
			}),
		);
	}

	private get middleware(): Parameters<typeof wrapLanguageModel>[0]['middleware'] {
		return {};
	}
}
