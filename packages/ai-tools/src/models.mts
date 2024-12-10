import type { AiModels } from '@chainfuse/types';
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
type EnumOrEnumLike<T> = T extends Record<string, infer V> ? V : T extends Readonly<Record<string, infer V>> ? V : never;
type LanguageModelValues = EnumOrEnumLike<(typeof AiModels.LanguageModels)[keyof typeof AiModels.LanguageModels]>;

type TextEmbeddingModelValues = EnumOrEnumLike<(typeof AiModels.TextEmbeddingModels)[keyof typeof AiModels.TextEmbeddingModels]>;

export class AiModel extends AiBase {
	public wrappedLanguageModel<P extends ValidProviders>(args: AiRequestConfig, provider: P, model: ProviderLanguageModels[P]): Promise<ReturnType<typeof wrapLanguageModel>>;
	public wrappedLanguageModel(args: AiRequestConfig, model: LanguageModelValues): Promise<ReturnType<typeof wrapLanguageModel>>;
	public wrappedLanguageModel<P extends ValidProviders>(args: AiRequestConfig, modelOrProvider: LanguageModelValues | P, model?: ProviderLanguageModels[P]) {
		return new AiRegistry(this.config).registry(args).then((registry) =>
			wrapLanguageModel({
				model: registry.languageModel(model ? `${modelOrProvider}:${model}` : modelOrProvider),
				middleware: this.middleware,
			}),
		);
	}

	public wrappedTextEmbeddingModel<P extends ValidProviders>(args: AiRequestConfig, provider: P, model: ProvidersTextEmbeddingModels[P]): Promise<Parameters<typeof embed | typeof embedMany>[0]['model']>;
	public wrappedTextEmbeddingModel(args: AiRequestConfig, model: TextEmbeddingModelValues): Promise<Parameters<typeof embed | typeof embedMany>[0]['model']>;
	public wrappedTextEmbeddingModel<P extends ValidProviders>(args: AiRequestConfig, modelOrProvider: TextEmbeddingModelValues | P, model?: ProvidersTextEmbeddingModels[P]): Promise<Parameters<typeof embed | typeof embedMany>[0]['model']> {
		return new AiRegistry(this.config).registry(args).then((registry) => registry.textEmbeddingModel(model ? `${modelOrProvider}:${model}` : modelOrProvider));
	}

	private get middleware(): Parameters<typeof wrapLanguageModel>[0]['middleware'] {
		return {};
	}
}
