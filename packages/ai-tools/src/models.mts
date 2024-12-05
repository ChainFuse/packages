import { experimental_wrapLanguageModel as wrapLanguageModel, type embed, type embedMany } from 'ai';
import { AiBase } from './base.mjs';
import { AiRegistry } from './registry.mjs';
import type { AiRequestConfig } from './types.mjs';

type ProvidersReturnType = Awaited<ReturnType<AiRegistry['providers']>>;
type ValidProviders = keyof ProvidersReturnType;
type ProviderLanguageModels = {
	[P in ValidProviders]: Parameters<ProvidersReturnType[P]['languageModel']>[0];
};
type ProvidersTextEmbeddingModels = {
	[P in ValidProviders]: Parameters<ProvidersReturnType[P]['textEmbeddingModel']>[0];
};

export class AiModels extends AiBase {
	/**
	 * @todo @demosjarco Take model enum instead of string.
	 */
	public wrappedLanguageModel<P extends ValidProviders>(args: AiRequestConfig, provider: P, model: ProviderLanguageModels[P]): Promise<ReturnType<typeof wrapLanguageModel>>;
	public wrappedLanguageModel(args: AiRequestConfig, model: ''): Promise<ReturnType<typeof wrapLanguageModel>>;
	public wrappedLanguageModel<P extends ValidProviders>(args: AiRequestConfig, modelOrProvider: string | P, model?: ProviderLanguageModels[P]) {
		return new AiRegistry(this.config).registry(args).then((registry) =>
			wrapLanguageModel({
				model: registry.languageModel(model ? `${modelOrProvider}:${model}` : modelOrProvider),
				middleware: this.middleware,
			}),
		);
	}

	public wrappedTextEmbeddingModel<P extends ValidProviders>(args: AiRequestConfig, provider: P, model: ProvidersTextEmbeddingModels[P]): Promise<Parameters<typeof embed | typeof embedMany>[0]['model']>;
	public wrappedTextEmbeddingModel(args: AiRequestConfig, model: ''): Promise<Parameters<typeof embed | typeof embedMany>[0]['model']>;
	public wrappedTextEmbeddingModel<P extends ValidProviders>(args: AiRequestConfig, modelOrProvider: string | P, model?: ProvidersTextEmbeddingModels[P]): Promise<Parameters<typeof embed | typeof embedMany>[0]['model']> {
		return new AiRegistry(this.config).registry(args).then((registry) => registry.textEmbeddingModel(model ? `${modelOrProvider}:${model}` : modelOrProvider));
	}

	private get middleware(): Parameters<typeof wrapLanguageModel>[0]['middleware'] {
		return {};
	}
}
