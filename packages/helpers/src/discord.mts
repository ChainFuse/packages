import type { CustomLoging } from '@chainfuse/types';
import type { ExecutionContext } from '@cloudflare/workers-types/experimental';
import { REST, type RESTOptions } from '@discordjs/rest';
import { CryptoHelpers } from './crypto.mjs';
import { NetHelpers } from './net.mjs';

export class DiscordHelpers {
	/**
	 * Discord Epoch, the first second of 2015 or 1420070400000
	 * @link https://discord.com/developers/docs/reference#snowflakes
	 */
	public static readonly discordEpoch = BigInt(1420070400000);

	/**
	 * Generate a Discord Snowflake ID from a given date. If no date is provided, the current date is used.
	 * @link https://discord.com/developers/docs/reference#snowflake-ids-in-pagination-generating-a-snowflake-id-from-a-timestamp-example
	 */
	public static dateToDiscordSnowflake(date = new Date()) {
		const minDate = new Date(Number(this.discordEpoch));
		const maxDate = new Date(2 ** 42 - 1);
		if (date < minDate) {
			throw new RangeError("The date is before discord's epoch");
		} else if (date > maxDate) {
			throw new RangeError('The date is after the highest supported date');
		}

		return (BigInt(date.valueOf()) - this.discordEpoch) << BigInt(22);
	}

	public static discordRest(apiKey: string, cacheTtl = 24 * 60 * 60, forceCache = false, executionContext?: ExecutionContext, logger: CustomLoging = false) {
		return new REST({
			agent: null,
			authPrefix: 'Bot',
			makeRequest: (url, rawInit) => {
				// Extra safety to make sure the string really is a URL
				const info = new URL(url);
				// CF's implementation of `RequestInit` is functionally the same as w3c `RequestInit` but TS doesn't know that
				const init = rawInit as RequestInit;

				const cacheKey = new Request(info, { ...init, headers: NetHelpers.stripSensitiveHeaders(new Headers(init.headers)) });
				if (logger) {
					console.debug('Discord Fetch request', cacheKey.url, JSON.stringify(NetHelpers.initBodyTrimmer({ ...init, headers: Object.fromEntries(NetHelpers.stripSensitiveHeaders(new Headers(init.headers)).entries()) }), null, '\t'));
				}

				if (cacheTtl && (rawInit.method?.toLowerCase() === 'get' || forceCache)) {
					// const cfCacheRef: Promise<Cache> | undefined = caches?.open('cfApi');
					const discordCacheRef = caches?.open(`discordApi`);

					return discordCacheRef
						.then((discordCache) =>
							discordCache
								.match(cacheKey)
								.then(async (cachedResponse) => {
									if (cachedResponse) {
										if (logger) {
											console.debug('Discord Cache hit', cacheKey.url);
										}

										// Clear out bad cache
										if (cachedResponse.status >= 500) {
											if (executionContext) {
												executionContext.waitUntil(discordCache.delete(cacheKey));
											} else {
												await discordCache.delete(cacheKey);
											}
										}

										return cachedResponse as unknown as ReturnType<Awaited<RESTOptions['makeRequest']>>;
									} else {
										if (logger) {
											console.warn('Discord Cache missed', cacheKey.url);
										}

										return NetHelpers.loggingFetch(info, init, undefined, logger).then(async (response) => {
											if (response.ok) {
												response = new Response(response.body, {
													...response,
													headers: NetHelpers.stripSensitiveHeaders(new Headers(response.headers)),
												});
												response.headers.set('Cache-Control', `s-maxage=${cacheTtl}`);

												if (response.headers.has('ETag')) {
													if (executionContext) {
														executionContext.waitUntil(
															discordCache
																.put(cacheKey, response.clone())
																.then(() => {
																	if (logger) {
																		console.debug('Discord Cache saved', 'with original etag', cacheKey.url);
																	}
																})
																.catch((error) => {
																	if (logger) {
																		console.error('Discord Cache put error', error);
																	}
																}),
														);
													} else {
														await discordCache
															.put(cacheKey, response.clone())
															.then(() => {
																if (logger) {
																	console.debug('Discord Cache saved', 'with original etag', cacheKey.url);
																}
															})
															.catch((error) => {
																if (logger) {
																	console.error('Discord Cache put error', error);
																}
															});
													}
												} else {
													if (executionContext) {
														executionContext.waitUntil(
															CryptoHelpers.generateETag(response)
																.then((etag) => response.headers.set('ETag', etag))
																.then(() =>
																	discordCache
																		.put(cacheKey, response.clone())
																		.then(() => {
																			if (logger) {
																				console.debug('Discord Cache saved', 'with generated etag', cacheKey.url);
																			}
																		})
																		.catch((error) => {
																			if (logger) {
																				console.error('Discord Cache put error', error);
																			}
																		}),
																)
																.catch((error) => {
																	if (logger) {
																		console.error('CryptoHelpers generateETag error', error);
																	}
																}),
														);
													} else {
														await CryptoHelpers.generateETag(response)
															.then((etag) => response.headers.set('ETag', etag))
															.then(() =>
																discordCache
																	.put(cacheKey, response.clone())
																	.then(() => {
																		if (logger) {
																			console.debug('Discord Cache saved', 'with generated etag', cacheKey.url);
																		}
																	})
																	.catch((error) => {
																		if (logger) {
																			console.error('Discord Cache put error', error);
																		}
																	}),
															)
															.catch((error) => {
																if (logger) {
																	console.error('CryptoHelpers generateETag error', error);
																}
															});
													}
												}
											}

											return response.clone() as unknown as ReturnType<Awaited<RESTOptions['makeRequest']>>;
										});
									}
								})
								.catch((error) => {
									if (logger) {
										console.error('Discord Cache match error', error);
									}

									return NetHelpers.loggingFetch(info, init, undefined, logger) as ReturnType<RESTOptions['makeRequest']>;
								}),
						)
						.catch((error) => {
							if (logger) {
								console.error('Discord Cache open error', error);
							}

							return NetHelpers.loggingFetch(info, init, undefined, logger) as ReturnType<RESTOptions['makeRequest']>;
						});
				} else {
					if (logger) {
						console.warn('Discord Cache ignored', cacheKey.url);
					}

					return NetHelpers.loggingFetch(info, init, undefined, logger) as ReturnType<RESTOptions['makeRequest']>;
				}
			},
		}).setToken(apiKey);
	}
}
