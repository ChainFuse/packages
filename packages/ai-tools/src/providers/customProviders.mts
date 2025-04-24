import type { GoogleGenerativeAIProvider } from '@ai-sdk/google';
import { Helpers } from '@chainfuse/helpers';
import { AiModels } from '@chainfuse/types/ai-tools';
import { enabledCloudflareLlmProviders, type cloudflareModelPossibilities } from '@chainfuse/types/ai-tools/workers-ai';
import { customProvider, TypeValidationError, wrapLanguageModel, type LanguageModelV1StreamPart } from 'ai';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import { ZodError } from 'zod';
import { AiBase } from '../base.mjs';
import type { AiConfigWorkersai, AiConfigWorkersaiRest, AiRequestConfig } from '../types.mjs';
import { AiRawProviders } from './rawProviders.mjs';

export class AiCustomProviders extends AiBase {
	public oaiOpenai(args: AiRequestConfig) {
		return new AiRawProviders(this.config).oaiOpenai(args);
	}

	public async azOpenai(args: AiRequestConfig) {
		return new AiRawProviders(this.config).azOpenai(args);
	}

	public anthropic(args: AiRequestConfig) {
		return new AiRawProviders(this.config).anthropic(args);
	}

	private static workersAiIsRest(arg: AiConfigWorkersai): arg is AiConfigWorkersaiRest {
		return typeof arg === 'object' && 'apiToken' in arg;
	}
	public async cfWorkersAi(args: AiRequestConfig) {
		const raw = new AiRawProviders(this.config);

		if (AiCustomProviders.workersAiIsRest(this.config.providers.workersAi)) {
			return customProvider({
				// @ts-expect-error override for types
				languageModels: await enabledCloudflareLlmProviders.reduce(
					async (accPromise, model) => {
						const acc = await accPromise;
						/**
						 * Intercept and add in missing index property to be OpenAI compatible
						 */
						// @ts-expect-error override for types
						acc[model] = wrapLanguageModel({
							model: (await raw.restWorkersAi(args))(model),
							middleware: [
								{
									wrapStream: async ({ doStream }) => {
										const { stream, ...rest } = await doStream();

										const transformStream = new TransformStream<LanguageModelV1StreamPart, LanguageModelV1StreamPart>({
											transform(chunk, controller) {
												if (chunk.type === 'error') {
													if (TypeValidationError.isInstance(chunk.error) && chunk.error.cause instanceof ZodError) {
														if (chunk.error.cause.issues.filter((issues) => issues.code === 'invalid_union')) {
															// Verify the specific error instead of assuming all errors
															const missingIndexPropertyError = chunk.error.cause.issues
																.filter((issues) => issues.code === 'invalid_union')
																.flatMap((issue) => issue.unionErrors)
																.flatMap((issue) => issue.issues)
																.filter((issue) => issue.code === 'invalid_type' && Helpers.areArraysEqual(issue.path, ['choices', 0, 'index']));

															if (missingIndexPropertyError.length > 0) {
																const newChunk = chunk.error.value as ChatCompletionChunk;

																newChunk.choices
																	.filter((choice) => choice.delta.content)
																	.forEach((choice) => {
																		controller.enqueue({
																			type: 'text-delta',
																			textDelta: choice.delta.content!,
																		});
																	});
															}
														}
													}
												} else {
													// Passthrough untouched
													controller.enqueue(chunk);
												}
											},
										});

										return {
											stream: stream.pipeThrough(transformStream),
											...rest,
										};
									},
								},
								// Fix output generation where it's correct, but encapsulated in a code fence
								{
									wrapGenerate: async ({ doGenerate, model }) => {
										const result = await doGenerate();

										/**
										 * `chunkSchema` is undocumented but always present in `model` regardless of model
										 * Can't use `responseFormat` (in `params`) because it isn't always present because some models don't support that part of openai api spec.
										 */
										if ('chunkSchema' in model) {
											const codeFenceStart = new RegExp(/^`{1,3}\w*\s*(?=[\[{])/i);
											const codefenceEnd = new RegExp(/(?![\]}])\s*`{1,3}$/i);

											return {
												...result,
												/**
												 * 1. trim initially to remove any leading/trailing whitespace
												 * 2. Remove start and end
												 * 3. Trim again to remove any leading/trailing whitespace
												 */
												text: result.text?.trim().replace(codeFenceStart, '').replace(codefenceEnd, '').trim(),
											};
										}

										return result;
									},
								},
							],
						});
						return acc;
					},
					Promise.resolve({} as Record<cloudflareModelPossibilities<'Text Generation'>, Awaited<ReturnType<AiRawProviders['restWorkersAi']>>>),
				),
				fallbackProvider: await raw.restWorkersAi(args),
			}) as Awaited<ReturnType<(typeof raw)['restWorkersAi']>>;
		} else {
			return new AiRawProviders(this.config).bindingWorkersAi(args);
		}
	}

	public custom(args: AiRequestConfig) {
		return new AiRawProviders(this.config).custom(args);
	}

	public async googleAi(args: AiRequestConfig): Promise<GoogleGenerativeAIProvider> {
		const fallbackProvider = await new AiRawProviders(this.config).googleAi(args);

		return customProvider({
			languageModels: {
				[AiModels.LanguageModels.GoogleGenerativeAi.gemini_flash_lite_search.split(':').slice(1).join(':')]: fallbackProvider(AiModels.LanguageModels.GoogleGenerativeAi.gemini_flash_lite_search.split(':')[1] as Parameters<typeof fallbackProvider>[0], { useSearchGrounding: true }),
				[AiModels.LanguageModels.GoogleGenerativeAi.gemini_flash_search.split(':').slice(1).join(':')]: fallbackProvider(AiModels.LanguageModels.GoogleGenerativeAi.gemini_flash_search.split(':')[1] as Parameters<typeof fallbackProvider>[0], { useSearchGrounding: true }),
				[AiModels.LanguageModels.GoogleGenerativeAi.gemini_pro_search.split(':').slice(1).join(':')]: fallbackProvider(AiModels.LanguageModels.GoogleGenerativeAi.gemini_pro_search.split(':')[1] as Parameters<typeof fallbackProvider>[0], { useSearchGrounding: true }),
			},
			fallbackProvider,
		}) as GoogleGenerativeAIProvider;
	}
}
