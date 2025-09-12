import type { ExecutionContext } from '@cloudflare/workers-types/experimental';
import { CDN, type RESTOptions } from '@discordjs/rest';
import * as z from 'zod/mini';
import { CryptoHelpers } from './crypto.mjs';
import { Methods, NetHelpers } from './net.mjs';

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

	/**
	 * Generate a date from a Discord Snowflake ID.
	 * @link https://discord.com/developers/docs/reference#snowflakes-snowflake-id-format-structure-left-to-right
	 */
	public static discordSnowflakeToDate(snowflakeRaw: bigint | string = this.discordEpoch) {
		const snowflake = BigInt(snowflakeRaw);
		return new Date(Number((snowflake >> BigInt(22)) + this.discordEpoch));
	}

	public static disordRestLogging = z._default(
		z.object({
			level: z._default(z.int().check(z.minimum(0), z.maximum(3)), 0),
			error: z._default(z.int().check(z.minimum(0), z.maximum(3)), 1),
			color: z._default(z.boolean(), true),
			custom: z.optional(
				z.pipe(
					z.unknown(),
					z.transform((fn) => fn as (...args: any[]) => void | Promise<void>),
				),
			),
		}),
		{
			level: 0,
			error: 1,
			color: true,
		},
	);

	public static discordRest(apiKey: string, _logging: z.input<typeof this.disordRestLogging>, cacheTtl = 24 * 60 * 60, forceCache = false, executionContext?: ExecutionContext, restOptions?: Partial<Omit<RESTOptions, 'agent' | 'authPrefix' | 'makeRequest'>>) {
		return Promise.all([import('@discordjs/rest'), import('./crypto.mjs').then(({ CryptoHelpers }) => CryptoHelpers.base62secret(8))]).then(([{ REST }, potentialId]) =>
			new REST({
				...restOptions,
				agent: null,
				authPrefix: 'Bot',
				makeRequest: (url, rawInit) =>
					DiscordHelpers.disordRestLogging.parseAsync(_logging).then(async (logging) => {
						// Extra safety to make sure the string really is a URL
						const info = new URL(url);
						// CF's implementation of `RequestInit` is functionally the same as w3c `RequestInit` but TS doesn't know that
						const init = rawInit as RequestInit;
						const loggingFetchInit: Parameters<typeof NetHelpers.loggingFetch>[1] = {
							...init,
							logging: {
								// discordRest has a different log level 2
								level: logging.level >= 2 ? logging.level - 1 : logging.level,
								error: logging.error >= 2 ? logging.error - 1 : logging.error,
								...('color' in logging && { color: logging.color }),
								...((logging.level > 0 || logging.error > 0) && {
									custom: async (...args: any[]) => {
										const [, id, , url] = args as [Date, string, Methods | number, string, Record<string, string>];
										const customUrl = new URL(url);

										if ('custom' in logging && logging.custom) {
											// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
											return logging.custom(...args.slice(0, -1));
										} else {
											await Promise.all([
												// Try the new native one
												import('node:util')
													.then(({ stripVTControlCharacters }) => stripVTControlCharacters)
													// For web or unavailable node in general
													.catch(() => import('strip-ansi').then(({ default: stripAnsi }) => stripAnsi)),
												import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })),
												import('./index.mts'),
											]).then(([ansiStripper, chalk, { Helpers }]) => {
												if (logging.level > 0) {
													console.info(
														'Discord Rest',
														// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
														...args
															// Convert date to ISO string
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
															// Wrap id in brackets
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value === id ? chalk.rgb(...Helpers.uniqueIdColor(ansiStripper(id)))(`[${ansiStripper(id)}]`) : value))
															// Strip out redundant parts of url
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value === url ? `${customUrl.pathname}${customUrl.search}${customUrl.hash}` : value)),
													);
												} else if (logging.error > 0) {
													console.error(
														'Discord Rest',
														// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
														...args
															// Convert date to ISO string
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
															// Wrap id in brackets
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value === id ? chalk.rgb(...Helpers.uniqueIdColor(ansiStripper(id)))(`[${ansiStripper(id)}]`) : value))
															// Strip out redundant parts of url
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value === url ? `${customUrl.pathname}${customUrl.search}${customUrl.hash}` : value)),
													);
												}
											});
										}
									},
								}),
							},
						};

						const cacheKey = new Request(info, { ...init, headers: NetHelpers.stripSensitiveHeaders(new Headers(init.headers)) });

						/**
						 * Only cache GET requests
						 * Empty method means GET
						 */
						if (caches && cacheTtl && ((rawInit.method ?? 'GET').toLowerCase() === 'get' || forceCache)) {
							// const cfCacheRef: Promise<Cache> | undefined = caches?.open('cfApi');
							const discordCacheRef = caches?.open(`discordApi`);

							return discordCacheRef
								.then((discordCache) =>
									discordCache
										.match(cacheKey)
										.then(async (cachedResponse) => {
											if (cachedResponse) {
												if (logging.level >= 2) {
													const customUrl = new URL(url);
													// eslint-disable-next-line @typescript-eslint/no-explicit-any
													const loggingItems: any[] = [new Date(), potentialId, cacheKey?.method ?? Methods.GET, 'CACHE-HIT', `${customUrl.pathname}${customUrl.search}${customUrl.hash}`];

													if ('color' in logging && logging.color) {
														await Promise.all([import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([chalk, { Helpers }]) => {
															loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(potentialId))(loggingItems[1]));
															loggingItems.splice(3, 1, chalk.green(loggingItems[3]));
														});
													}

													if ('custom' in logging && logging.custom) {
														// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
														await logging.custom(...loggingItems);
													} else {
														console.info(
															// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
															...loggingItems
																// Convert date to ISO string
																// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
																// Wrap id in brackets
																// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																.map((value) => (typeof value === 'string' && value.includes(potentialId) ? value.replace(potentialId, `[${potentialId}]`) : value)),
														);
													}
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
												if (logging.level >= 2) {
													const customUrl = new URL(url);
													// eslint-disable-next-line @typescript-eslint/no-explicit-any
													const loggingItems: any[] = [new Date(), potentialId, cacheKey?.method ?? Methods.GET, 'CACHE-MISS', `${customUrl.pathname}${customUrl.search}${customUrl.hash}`];

													if ('color' in logging && logging.color) {
														await Promise.all([import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([chalk, { Helpers }]) => {
															loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(potentialId))(loggingItems[1]));
															loggingItems.splice(3, 1, chalk.yellow(loggingItems[3]));
														});
													}

													if ('custom' in logging && logging.custom) {
														// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
														await logging.custom(...loggingItems);
													} else {
														console.info(
															// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
															...loggingItems
																// Convert date to ISO string
																// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
																// Wrap id in brackets
																// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																.map((value) => (typeof value === 'string' && value.includes(potentialId) ? value.replace(potentialId, `[${potentialId}]`) : value)),
														);
													}
												}

												return NetHelpers.loggingFetch(info, loggingFetchInit).then(async (response) => {
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
																		.then(async () => {
																			if (logging.level >= 2) {
																				const customUrl = new URL(url);
																				// eslint-disable-next-line @typescript-eslint/no-explicit-any
																				const loggingItems: any[] = [new Date(), potentialId, cacheKey?.method ?? Methods.GET, 'CACHE-PUT', `${customUrl.pathname}${customUrl.search}${customUrl.hash}`];

																				if ('color' in logging && logging.color) {
																					await Promise.all([import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([chalk, { Helpers }]) => {
																						loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(potentialId))(loggingItems[1]));
																						loggingItems.splice(3, 1, chalk.blue(loggingItems[3]));
																					});
																				}

																				if ('custom' in logging && logging.custom) {
																					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																					await logging.custom(...loggingItems);
																				} else {
																					console.info(
																						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																						...loggingItems
																							// Convert date to ISO string
																							// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																							.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
																							// Wrap id in brackets
																							// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																							.map((value) => (typeof value === 'string' && value.includes(potentialId) ? value.replace(potentialId, `[${potentialId}]`) : value)),
																					);
																				}
																			}
																		})
																		.catch(async (error) => {
																			if (logging.level >= 2) {
																				const customUrl = new URL(url);
																				// eslint-disable-next-line @typescript-eslint/no-explicit-any
																				const loggingItems: any[] = [new Date(), potentialId, cacheKey?.method ?? Methods.GET, `CACHE-ERROR: ${error}`, `${customUrl.pathname}${customUrl.search}${customUrl.hash}`];

																				if ('color' in logging && logging.color) {
																					await Promise.all([import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([chalk, { Helpers }]) => {
																						loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(potentialId))(loggingItems[1]));
																						loggingItems.splice(3, 1, chalk.red(loggingItems[3]));
																					});
																				}

																				if ('custom' in logging && logging.custom) {
																					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																					await logging.custom(...loggingItems);
																				} else {
																					console.info(
																						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																						...loggingItems
																							// Convert date to ISO string
																							// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																							.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
																							// Wrap id in brackets
																							// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																							.map((value) => (typeof value === 'string' && value.includes(potentialId) ? value.replace(potentialId, `[${potentialId}]`) : value)),
																					);
																				}
																			}
																		}),
																);
															} else {
																await discordCache
																	.put(cacheKey, response.clone())
																	.then(async () => {
																		if (logging.level >= 2) {
																			const customUrl = new URL(url);
																			// eslint-disable-next-line @typescript-eslint/no-explicit-any
																			const loggingItems: any[] = [new Date(), potentialId, cacheKey?.method ?? Methods.GET, 'CACHE-PUT', `${customUrl.pathname}${customUrl.search}${customUrl.hash}`];

																			if ('color' in logging && logging.color) {
																				await Promise.all([import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([chalk, { Helpers }]) => {
																					loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(potentialId))(loggingItems[1]));
																					loggingItems.splice(3, 1, chalk.blue(loggingItems[3]));
																				});
																			}

																			if ('custom' in logging && logging.custom) {
																				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																				await logging.custom(...loggingItems);
																			} else {
																				console.info(
																					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																					...loggingItems
																						// Convert date to ISO string
																						// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																						.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
																						// Wrap id in brackets
																						// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																						.map((value) => (typeof value === 'string' && value.includes(potentialId) ? value.replace(potentialId, `[${potentialId}]`) : value)),
																				);
																			}
																		}
																	})
																	.catch(async (error) => {
																		if (logging.level >= 2) {
																			const customUrl = new URL(url);
																			// eslint-disable-next-line @typescript-eslint/no-explicit-any
																			const loggingItems: any[] = [new Date(), potentialId, cacheKey?.method ?? Methods.GET, `CACHE-ERROR: ${error}`, `${customUrl.pathname}${customUrl.search}${customUrl.hash}`];

																			if ('color' in logging && logging.color) {
																				await Promise.all([import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([chalk, { Helpers }]) => {
																					loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(potentialId))(loggingItems[1]));
																					loggingItems.splice(3, 1, chalk.red(loggingItems[3]));
																				});
																			}

																			if ('custom' in logging && logging.custom) {
																				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																				await logging.custom(...loggingItems);
																			} else {
																				console.info(
																					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																					...loggingItems
																						// Convert date to ISO string
																						// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																						.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
																						// Wrap id in brackets
																						// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																						.map((value) => (typeof value === 'string' && value.includes(potentialId) ? value.replace(potentialId, `[${potentialId}]`) : value)),
																				);
																			}
																		}
																	});
															}
														} else {
															if (executionContext) {
																executionContext.waitUntil(
																	CryptoHelpers.generateETag(response)
																		.then((etag) => response.headers.set('ETag', etag))
																		.then(() =>
																			discordCache.put(cacheKey, response.clone()).then(async () => {
																				if (logging.level >= 2) {
																					const customUrl = new URL(url);
																					// eslint-disable-next-line @typescript-eslint/no-explicit-any
																					const loggingItems: any[] = [new Date(), potentialId, cacheKey?.method ?? Methods.GET, 'CACHE-PUT', `${customUrl.pathname}${customUrl.search}${customUrl.hash}`];

																					if ('color' in logging && logging.color) {
																						await Promise.all([import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([chalk, { Helpers }]) => {
																							loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(potentialId))(loggingItems[1]));
																							loggingItems.splice(3, 1, chalk.blue(loggingItems[3]));
																						});
																					}

																					if ('custom' in logging && logging.custom) {
																						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																						await logging.custom(...loggingItems);
																					} else {
																						console.info(
																							// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																							...loggingItems
																								// Convert date to ISO string
																								// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																								.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
																								// Wrap id in brackets
																								// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																								.map((value) => (typeof value === 'string' && value.includes(potentialId) ? value.replace(potentialId, `[${potentialId}]`) : value)),
																						);
																					}
																				}
																			}),
																		)
																		.catch(async (error) => {
																			if (logging.level >= 2) {
																				const customUrl = new URL(url);
																				// eslint-disable-next-line @typescript-eslint/no-explicit-any
																				const loggingItems: any[] = [new Date(), potentialId, cacheKey?.method ?? Methods.GET, `CACHE-ERROR: ${error}`, `${customUrl.pathname}${customUrl.search}${customUrl.hash}`];

																				if ('color' in logging && logging.color) {
																					await Promise.all([import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([chalk, { Helpers }]) => {
																						loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(potentialId))(loggingItems[1]));
																						loggingItems.splice(3, 1, chalk.red(loggingItems[3]));
																					});
																				}

																				if ('custom' in logging && logging.custom) {
																					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																					await logging.custom(...loggingItems);
																				} else {
																					console.info(
																						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																						...loggingItems
																							// Convert date to ISO string
																							// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																							.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
																							// Wrap id in brackets
																							// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																							.map((value) => (typeof value === 'string' && value.includes(potentialId) ? value.replace(potentialId, `[${potentialId}]`) : value)),
																					);
																				}
																			}
																		}),
																);
															} else {
																await CryptoHelpers.generateETag(response)
																	.then((etag) => response.headers.set('ETag', etag))
																	.then(() =>
																		discordCache.put(cacheKey, response.clone()).then(async () => {
																			if (logging.level >= 2) {
																				const customUrl = new URL(url);
																				// eslint-disable-next-line @typescript-eslint/no-explicit-any
																				const loggingItems: any[] = [new Date(), potentialId, cacheKey?.method ?? Methods.GET, 'CACHE-PUT', `${customUrl.pathname}${customUrl.search}${customUrl.hash}`];

																				if ('color' in logging && logging.color) {
																					await Promise.all([import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([chalk, { Helpers }]) => {
																						loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(potentialId))(loggingItems[1]));
																						loggingItems.splice(3, 1, chalk.blue(loggingItems[3]));
																					});
																				}

																				if ('custom' in logging && logging.custom) {
																					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																					await logging.custom(...loggingItems);
																				} else {
																					console.info(
																						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																						...loggingItems
																							// Convert date to ISO string
																							// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																							.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
																							// Wrap id in brackets
																							// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																							.map((value) => (typeof value === 'string' && value.includes(potentialId) ? value.replace(potentialId, `[${potentialId}]`) : value)),
																					);
																				}
																			}
																		}),
																	)
																	.catch(async (error) => {
																		if (logging.level >= 2) {
																			const customUrl = new URL(url);
																			// eslint-disable-next-line @typescript-eslint/no-explicit-any
																			const loggingItems: any[] = [new Date(), potentialId, cacheKey?.method ?? Methods.GET, `CACHE-ERROR: ${error}`, `${customUrl.pathname}${customUrl.search}${customUrl.hash}`];

																			if ('color' in logging && logging.color) {
																				await Promise.all([import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([chalk, { Helpers }]) => {
																					loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(potentialId))(loggingItems[1]));
																					loggingItems.splice(3, 1, chalk.red(loggingItems[3]));
																				});
																			}

																			if ('custom' in logging && logging.custom) {
																				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																				await logging.custom(...loggingItems);
																			} else {
																				console.info(
																					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
																					...loggingItems
																						// Convert date to ISO string
																						// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																						.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
																						// Wrap id in brackets
																						// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																						.map((value) => (typeof value === 'string' && value.includes(potentialId) ? value.replace(potentialId, `[${potentialId}]`) : value)),
																				);
																			}
																		}
																	});
															}
														}
													}

													return response.clone() as unknown as ReturnType<Awaited<RESTOptions['makeRequest']>>;
												});
											}
										})
										.catch(async (error) => {
											if (logging.level >= 2) {
												const customUrl = new URL(url);
												// eslint-disable-next-line @typescript-eslint/no-explicit-any
												const loggingItems: any[] = [new Date(), potentialId, cacheKey?.method ?? Methods.GET, `CACHE-ERROR: ${error}`, `${customUrl.pathname}${customUrl.search}${customUrl.hash}`];

												if ('color' in logging && logging.color) {
													await Promise.all([import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([chalk, { Helpers }]) => {
														loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(potentialId))(loggingItems[1]));
														loggingItems.splice(3, 1, chalk.red(loggingItems[3]));
													});
												}

												if ('custom' in logging && logging.custom) {
													// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
													await logging.custom(...loggingItems);
												} else {
													console.info(
														// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
														...loggingItems
															// Convert date to ISO string
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
															// Wrap id in brackets
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (typeof value === 'string' && value.includes(potentialId) ? value.replace(potentialId, `[${potentialId}]`) : value)),
													);
												}
											}

											return NetHelpers.loggingFetch(info, loggingFetchInit) as ReturnType<RESTOptions['makeRequest']>;
										}),
								)
								.catch(async (error) => {
									if (logging.level >= 2) {
										const customUrl = new URL(url);
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										const loggingItems: any[] = [new Date(), potentialId, cacheKey?.method ?? Methods.GET, `CACHE-ERROR: ${error}`, `${customUrl.pathname}${customUrl.search}${customUrl.hash}`];

										if ('color' in logging && logging.color) {
											await Promise.all([import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([chalk, { Helpers }]) => {
												loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(potentialId))(loggingItems[1]));
												loggingItems.splice(3, 1, chalk.red(loggingItems[3]));
											});
										}

										if ('custom' in logging && logging.custom) {
											// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
											await logging.custom(...loggingItems);
										} else {
											console.info(
												// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
												...loggingItems
													// Convert date to ISO string
													// eslint-disable-next-line @typescript-eslint/no-unsafe-return
													.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
													// Wrap id in brackets
													// eslint-disable-next-line @typescript-eslint/no-unsafe-return
													.map((value) => (typeof value === 'string' && value.includes(potentialId) ? value.replace(potentialId, `[${potentialId}]`) : value)),
											);
										}
									}

									return NetHelpers.loggingFetch(info, loggingFetchInit) as ReturnType<RESTOptions['makeRequest']>;
								});
						} else {
							if (logging.level >= 2) {
								const customUrl = new URL(url);
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								const loggingItems: any[] = [new Date(), potentialId, cacheKey?.method ?? Methods.GET, 'CACHE-IGNORE', `${customUrl.pathname}${customUrl.search}${customUrl.hash}`];

								if ('color' in logging && logging.color) {
									await Promise.all([import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([chalk, { Helpers }]) => {
										loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(potentialId))(loggingItems[1]));
										loggingItems.splice(3, 1, chalk.yellow(loggingItems[3]));
									});
								}

								if ('custom' in logging && logging.custom) {
									// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
									await logging.custom(...loggingItems);
								} else {
									console.info(
										// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
										...loggingItems
											// Convert date to ISO string
											// eslint-disable-next-line @typescript-eslint/no-unsafe-return
											.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
											// Wrap id in brackets
											// eslint-disable-next-line @typescript-eslint/no-unsafe-return
											.map((value) => (typeof value === 'string' && value.includes(potentialId) ? value.replace(potentialId, `[${potentialId}]`) : value)),
									);
								}
							}

							return NetHelpers.loggingFetch(info, loggingFetchInit) as ReturnType<RESTOptions['makeRequest']>;
						}
					}),
			}).setToken(apiKey),
		);
	}

	public static userIcon(userId: bigint | string, userIconHash?: Parameters<CDN['avatar']>[1] | null, guildId?: bigint | string, memberIconHash?: Parameters<CDN['avatar']>[1] | null, options?: Parameters<CDN['avatar']>[2]) {
		options = {
			extension: (memberIconHash ?? userIconHash)?.startsWith('a_') ? 'gif' : 'png',
			...options,
		};

		if (userIconHash) {
			if (guildId && memberIconHash) {
				return new CDN().guildMemberAvatar(BigInt(guildId).toString(), BigInt(userId).toString(), memberIconHash, options);
			} else {
				return new CDN().avatar(BigInt(userId).toString(), userIconHash, options);
			}
		} else {
			return new CDN().defaultAvatar(Number((BigInt(userId) >> BigInt(22)) % BigInt(6)));
		}
	}

	public static guildIcon(guildId: bigint | string, iconHash: Parameters<CDN['icon']>[1], options?: Parameters<CDN['icon']>[2]) {
		return new CDN().icon(BigInt(guildId).toString(), iconHash, {
			extension: iconHash.startsWith('a_') ? 'gif' : 'png',
			...options,
		});
	}
}
