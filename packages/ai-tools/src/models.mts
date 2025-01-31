import type { ImageModelValues, LanguageModelValues, TextEmbeddingModelValues } from '@chainfuse/types';
import { wrapLanguageModel, type embed, type embedMany, type experimental_generateImage as generateImage } from 'ai';
import { AiBase } from './base.mjs';
import { AiRegistry } from './registry.mjs';
import type { AiRequestConfig } from './types.mjs';

type ProvidersReturnType = Awaited<ReturnType<AiRegistry['providers']>>;
type ValidProviders = keyof ProvidersReturnType;
type ProviderLanguageModels = {
	[P in ValidProviders]: Parameters<ProvidersReturnType[P]['languageModel']>[0];
};
type ValidImageProviders = {
	[P in ValidProviders]: ProvidersReturnType[P] extends { imageModel: (...args: any[]) => any } ? P : never;
}[ValidProviders];
type ProviderImageModels = {
	[P in Extract<ValidImageProviders, ValidProviders>]: Parameters<ProvidersReturnType[P]['imageModel']>[0];
};
type ProviderTextEmbeddingModels = {
	[P in ValidProviders]: Parameters<ProvidersReturnType[P]['textEmbeddingModel']>[0];
};

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

	public wrappedImageModel<P extends ValidImageProviders>(args: AiRequestConfig, provider: P, model: ProviderImageModels[P]): Promise<Parameters<typeof generateImage>[0]['model']>;
	public wrappedImageModel(args: AiRequestConfig, model: ImageModelValues): Promise<Parameters<typeof generateImage>[0]['model']>;
	public wrappedImageModel<P extends ValidImageProviders>(args: AiRequestConfig, modelOrProvider: ImageModelValues | P, model?: ProviderImageModels[P]): Promise<Parameters<typeof generateImage>[0]['model']> {
		return new AiRegistry(this.config).registry(args).then((registry) => registry.imageModel(model ? `${modelOrProvider}:${model}` : modelOrProvider));
	}

	public wrappedTextEmbeddingModel<P extends ValidProviders>(args: AiRequestConfig, provider: P, model: ProviderTextEmbeddingModels[P]): Promise<Parameters<typeof embed | typeof embedMany>[0]['model']>;
	public wrappedTextEmbeddingModel(args: AiRequestConfig, model: TextEmbeddingModelValues): Promise<Parameters<typeof embed | typeof embedMany>[0]['model']>;
	public wrappedTextEmbeddingModel<P extends ValidProviders>(args: AiRequestConfig, modelOrProvider: TextEmbeddingModelValues | P, model?: ProviderTextEmbeddingModels[P]): Promise<Parameters<typeof embed | typeof embedMany>[0]['model']> {
		return new AiRegistry(this.config).registry(args).then((registry) => registry.textEmbeddingModel(model ? `${modelOrProvider}:${model}` : modelOrProvider));
	}

	private get middleware(): Parameters<typeof wrapLanguageModel>[0]['middleware'] {
		return {};
	}
}
