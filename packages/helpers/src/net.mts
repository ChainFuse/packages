import type { z as z3 } from 'zod/v3';
import type { z as z4 } from 'zod/v4';

export type LoggingFetchInitType<RI extends RequestInit = RequestInit> = RI & z3.input<Awaited<ReturnType<typeof NetHelpers.loggingFetchInit>>>;

/**
 * Enum representing HTTP request methods.
 *
 * Each member of the enum corresponds to a standard HTTP method, which can be used to specify the desired action to be performed on a given resource.
 */
export enum Methods {
	'GET' = 'GET',
	'HEAD' = 'HEAD',
	'POST' = 'POST',
	'PUT' = 'PUT',
	'DELETE' = 'DELETE',
	'CONNECT' = 'CONNECT',
	'OPTIONS' = 'OPTIONS',
	'TRACE' = 'TRACE',
	'PATCH' = 'PATCH',
}

export class NetHelpers {
	public static cfApiLogging() {
		return import('zod/v3').then(({ z: z3 }) =>
			z3
				.object({
					level: z3.coerce.number().int().min(0).max(3).default(0),
					error: z3.coerce.number().int().min(0).max(3).default(1),
					color: z3.boolean().default(true),
					custom: z3
						.function()
						.args()
						.returns(z3.union([z3.void(), z3.promise(z3.void())]))
						.optional(),
				})
				.default({}),
		);
	}
	/**
	 * Creates an instance of the Cloudflare API client with enhanced logging capabilities.
	 *
	 * @param apiKey - The API token used to authenticate with the Cloudflare API.
	 * @param logging - The logging configuration object, parsed using the `cfApiLogging` parser.
	 *
	 * @returns A promise that resolves to an instance of the Cloudflare API client.
	 *
	 * The logging configuration supports the following properties:
	 * - `level`: The logging level. If set to `1`, it is internally treated as `2` to include headers for the `cf-ray` ID, but reset back to 1 for the returned logs.
	 * - `color`: Optional. If `true`, enables colored output using the `chalk` library.
	 * - `custom`: Optional. A custom logging function that receives detailed request and response information.
	 *
	 * The function also enhances logging by:
	 * - Extracting and displaying the `cf-ray` ID from response headers.
	 * - Formatting and coloring log output for better readability.
	 * - Stripping redundant parts of URLs and wrapping unique IDs in brackets with color coding.
	 */
	public static cfApi(apiKey: string, logging?: z3.input<Awaited<ReturnType<typeof NetHelpers.cfApiLogging>>>) {
		return Promise.all([
			//
			import('cloudflare'),
			NetHelpers.cfApiLogging().then((parser) => parser.parseAsync(logging)),
		]).then(
			([{ Cloudflare }, logging]) =>
				new Cloudflare({
					apiToken: apiKey,
					fetch: (info, init) =>
						this.loggingFetch(info, {
							...init,
							logging: {
								// Fake level 1 as 2 to get headers for ray-id
								level: logging.level === 1 ? 2 : logging.level,
								error: logging.error === 1 ? 2 : logging.error,
								...('color' in logging && { color: logging.color }),
								...((logging.level > 0 || logging.error > 0) && {
									custom: async (...args: any[]) => {
										const [, id, , url, headers] = args as [Date, string, Methods | number, string, Record<string, string>];
										const customUrl = new URL(url);
										const customHeaders = new Headers(headers);

										if (customHeaders.has('cf-ray')) {
											args.splice(3, 0, customHeaders.get('cf-ray'));

											if ('color' in logging && logging.color) {
												await import('chalk')
													.then(({ Chalk }) => new Chalk({ level: 2 }))
													// eslint-disable-next-line @typescript-eslint/no-unsafe-return
													.then((chalk) => args.splice(3, 1, chalk.rgb(255, 102, 51)(customHeaders.get('cf-ray'))))
													// eslint-disable-next-line @typescript-eslint/no-empty-function
													.catch(() => {});
											}
										}

										if ('custom' in logging && logging.custom) {
											// We faked level 1 as 2 to get headers for ray-id
											if (logging.level === 1 || logging.error === 1) {
												// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
												return logging.custom(...args.slice(0, -1));
											} else {
												// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
												return logging.custom(...args);
											}
										} else {
											await Promise.all([import('strip-ansi'), import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([{ default: stripAnsi }, chalk, { Helpers }]) => {
												// We faked level 1 as 2 to get headers for ray-id
												if (logging.level === 1) {
													console.info(
														'CF Rest',
														// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
														...args
															.slice(0, -1)
															// Convert date to ISO string
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
															// Wrap id in brackets
															.map((value) => {
																if (value === id) {
																	const wrappedString = `[${stripAnsi(id)}]`;

																	if (logging.color) {
																		return chalk.rgb(...Helpers.uniqueIdColor(stripAnsi(id)))(wrappedString);
																	} else {
																		return wrappedString;
																	}
																} else {
																	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																	return value;
																}
															})
															// Strip out redundant parts of url
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value === url ? `${customUrl.pathname}${customUrl.search}${customUrl.hash}` : value)),
													);
												} else if (logging.error === 1) {
													console.error(
														'CF Rest',
														// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
														...args
															.slice(0, -1)
															// Convert date to ISO string
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
															// Wrap id in brackets
															.map((value) => {
																if (value === id) {
																	const wrappedString = `[${stripAnsi(id)}]`;

																	if (logging.color) {
																		return chalk.rgb(...Helpers.uniqueIdColor(stripAnsi(id)))(wrappedString);
																	} else {
																		return wrappedString;
																	}
																} else {
																	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																	return value;
																}
															})
															// Strip out redundant parts of url
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value === url ? `${customUrl.pathname}${customUrl.search}${customUrl.hash}` : value)),
													);
												} else if (logging.level > 0) {
													console.info(
														'CF Rest',
														// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
														...args
															// Convert date to ISO string
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
															// Wrap id in brackets
															.map((value) => {
																if (value === id) {
																	const wrappedString = `[${stripAnsi(id)}]`;

																	if (logging.color) {
																		return chalk.rgb(...Helpers.uniqueIdColor(stripAnsi(id)))(wrappedString);
																	} else {
																		return wrappedString;
																	}
																} else {
																	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																	return value;
																}
															})
															// Strip out redundant parts of url
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value === url ? `${customUrl.pathname}${customUrl.search}${customUrl.hash}` : value)),
													);
												} else if (logging.error > 0) {
													console.error(
														'CF Rest',
														// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
														...args
															// Convert date to ISO string
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
															// Wrap id in brackets
															.map((value) => {
																if (value === id) {
																	const wrappedString = `[${stripAnsi(id)}]`;

																	if (logging.color) {
																		return chalk.rgb(...Helpers.uniqueIdColor(stripAnsi(id)))(wrappedString);
																	} else {
																		return wrappedString;
																	}
																} else {
																	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
																	return value;
																}
															})
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
						}),
				}),
		);
	}

	public static loggingFetchInit() {
		return Promise.all([import('zod/v3'), this.loggingFetchInitLogging()]).then(([{ z: z3 }, logging]) =>
			z3.object({
				logging,
			}),
		);
	}
	public static loggingFetchInitLogging() {
		return import('zod/v3').then(({ z: z3 }) =>
			z3
				.object({
					level: z3.coerce.number().int().min(0).max(3).default(0),
					error: z3.coerce.number().int().min(0).max(3).default(1),
					color: z3.boolean().default(true),
					custom: z3
						.function()
						.returns(z3.union([z3.void(), z3.promise(z3.void())]))
						.optional(),
				})
				.default({}),
		);
	}
	/**
	 * A utility function that wraps the native `fetch` API with enhanced capabilities.
	 * This function allows for customizable logging of request and response details, including headers, body, and status, with support for colorized output and custom logging handlers.
	 *
	 * @template RI - The type of the `RequestInit` object, defaulting to `RequestInit`. Intended for Cloudflare's `RequestInit` variation.
	 *
	 * @param info - The input to the `fetch` function, which can be a `Request` object or a URL string.
	 * @param init - An optional configuration object extending `RequestInit` with additional options.
	 *
	 * @returns A promise that resolves to the `Response` object returned by the `fetch` call.
	 *
	 * ### Logging Levels:
	 * - `level >= 1`: Logs basic request details (timestamp, unique ID, method, and URL).
	 * - `level >= 2`: Logs request headers (with sensitive headers stripped).
	 * - `level >= 3`: Logs request body (if available) and response body (if available).
	 *
	 * ### Error Logging Levels:
	 * - `error >= 1`: Logs basic request details (timestamp, unique ID, method, and URL) only if an error occurs.
	 * - `error >= 2`: Logs request headers (with sensitive headers stripped) only if an error occurs.
	 * - `error >= 3`: Logs request body (if available) and response body (if available) only if an error occurs.
	 *
	 * ### Logging Options:
	 * - `logging.level`: The verbosity level of logging (1, 2, or 3).
	 * - `logging.error`: The verbosity level of error logging (1, 2, or 3).
	 * - `logging.color`: A boolean indicating whether to use colorized output.
	 * - `logging.custom`: An optional custom logging function to handle the log output.
	 *
	 * ### Features:
	 * - Automatically generates a unique ID for each request.
	 * - Strips sensitive headers from logs to ensure security.
	 * - Supports JSON and stream-based request/response bodies.
	 * - Allows for colorized output using the `chalk` library.
	 * - Provides hooks for custom logging implementations.
	 */
	public static loggingFetch<RI extends RequestInit = RequestInit>(info: Parameters<typeof fetch>[0], init?: LoggingFetchInitType<RI>) {
		return Promise.all([
			NetHelpers.loggingFetchInit()
				.then((parser) => parser.passthrough().parseAsync(init))
				.then((parsed) => parsed as unknown as RI & z3.output<Awaited<ReturnType<typeof NetHelpers.loggingFetchInit>>>),
			import('./crypto.mts').then(({ CryptoHelpers }) => CryptoHelpers.base62secret(8)),
		]).then(async ([init, id]) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const requestErrorItems: any[] = [new Date(), id, init?.method ?? Methods.GET, this.isRequestLike(info) ? info.url : info.toString()];

			if (init.logging.level || init.logging.error) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const requestLoggingItems: any[] = [new Date(), id, init?.method ?? Methods.GET, this.isRequestLike(info) ? info.url : info.toString()];

				if (init.logging.level >= 2) {
					requestLoggingItems.push(Object.fromEntries(this.stripSensitiveHeaders(new Headers(init?.headers)).entries()) as Record<string, string>);
				}
				if (init.logging.error >= 2) {
					requestErrorItems.push(Object.fromEntries(this.stripSensitiveHeaders(new Headers(init?.headers)).entries()) as Record<string, string>);
				}

				if (init.logging.level >= 3 && init?.body) {
					if (init.body instanceof ReadableStream) {
						requestLoggingItems.push(Array.from(new Uint8Array(await new Response(init.body).arrayBuffer())));
					} else if (new Headers(init.headers).get('Content-Type')?.toLowerCase().startsWith('application/json')) {
						requestLoggingItems.push(JSON.parse(init.body as string));
					} else {
						requestLoggingItems.push(init.body);
					}
				}
				if (init.logging.error >= 3 && init?.body) {
					if (init.body instanceof ReadableStream) {
						requestErrorItems.push(Array.from(new Uint8Array(await new Response(init.body).arrayBuffer())));
					} else if (new Headers(init.headers).get('Content-Type')?.toLowerCase().startsWith('application/json')) {
						requestErrorItems.push(JSON.parse(init.body as string));
					} else {
						requestErrorItems.push(init.body);
					}
				}

				if ('color' in init.logging && init.logging.color) {
					await Promise.allSettled([
						Promise.all([import('chalk').then(({ Chalk }) => new Chalk({ level: 2 })), import('./index.mts')]).then(([chalk, { Helpers }]) => {
							requestLoggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(id))(id));
							requestErrorItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(id))(id));
						}),
						this.methodColors(requestLoggingItems[2] as Methods).then((color) => {
							if (color) {
								requestLoggingItems.splice(2, 1, color(requestLoggingItems[2]));
							}
						}),
						this.methodColors(requestErrorItems[2] as Methods).then((color) => {
							if (color) {
								requestErrorItems.splice(2, 1, color(requestErrorItems[2]));
							}
						}),
						// eslint-disable-next-line @typescript-eslint/no-empty-function
					]).catch(() => {});
				}

				if (init.logging.level > 0 && 'custom' in init.logging && init.logging.custom) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
					await init.logging.custom(...requestLoggingItems);
				} else if (init.logging.level > 0) {
					console.info(
						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
						...requestLoggingItems
							// Convert date to ISO string
							// eslint-disable-next-line @typescript-eslint/no-unsafe-return
							.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
							// Wrap id in brackets
							// eslint-disable-next-line @typescript-eslint/no-unsafe-return
							.map((value) => (typeof value === 'string' && value.includes(id) ? value.replace(id, `[${id}]`) : value)),
					);
				}
			}

			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			return new Promise<Awaited<ReturnType<typeof fetch>>>((resolve, reject) =>
				fetch(info, init)
					.then(async (response) => {
						if (init.logging.level || init.logging.error) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const responseLoggingItems: any[] = [new Date(), id, response.status, response.url];
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const responseErrorItems: any[] = [new Date(), id, response.status, response.url];

							if (init.logging.level >= 2) {
								responseLoggingItems.push(Object.fromEntries(this.stripSensitiveHeaders(response.headers).entries()) as Record<string, string>);
							}
							if (init.logging.error >= 2) {
								responseErrorItems.push(Object.fromEntries(this.stripSensitiveHeaders(response.headers).entries()) as Record<string, string>);
							}

							if (init.logging.level >= 3 && init?.body) {
								const loggingClone = response.clone();

								if (response.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
									responseLoggingItems.push(await loggingClone.json());
								} else {
									responseLoggingItems.push(await loggingClone.text());
								}
								/**
								 * @todo @demosjarco detect if the body is a stream and convert it to an array
								 */
							}
							if (init.logging.error >= 3 && init?.body) {
								const loggingClone = response.clone();

								if (response.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
									responseErrorItems.push(await loggingClone.json());
								} else {
									responseErrorItems.push(await loggingClone.text());
								}
								/**
								 * @todo @demosjarco detect if the body is a stream and convert it to an array
								 */
							}

							if ('color' in init.logging && init.logging.color) {
								await Promise.all([import('chalk'), import('./index.mts')])
									.then(([{ Chalk }, { Helpers }]) => {
										const chalk = new Chalk({ level: 2 });

										responseLoggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(id))(id));
										responseLoggingItems.splice(2, 1, response.ok ? chalk.green(response.status) : chalk.red(response.status));

										responseErrorItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(id))(id));
										responseErrorItems.splice(2, 1, response.ok ? chalk.green(response.status) : chalk.red(response.status));
									})
									// eslint-disable-next-line @typescript-eslint/no-empty-function
									.catch(() => {});
							}

							if (init.logging.level > 0 && 'custom' in init.logging && init.logging.custom) {
								// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
								await init.logging.custom(...responseLoggingItems);
							} else if (init.logging.error > 0 && !response.ok && 'custom' in init.logging && init.logging.custom) {
								// Send request errors too (since we barely now know if error or not)
								// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
								await init.logging.custom(...requestErrorItems);

								// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
								await init.logging.custom(...responseErrorItems);
							} else if (init.logging.level > 0) {
								console.info(
									// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
									...responseLoggingItems
										// Convert date to ISO string
										// eslint-disable-next-line @typescript-eslint/no-unsafe-return
										.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
										// Wrap id in brackets
										// eslint-disable-next-line @typescript-eslint/no-unsafe-return
										.map((value) => (typeof value === 'string' && value.includes(id) ? value.replace(id, `[${id}]`) : value)),
								);
							} else if (init.logging.error > 0 && !response.ok) {
								// Send request errors too (since we barely now know if error or not)
								console.error(
									// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
									...requestErrorItems
										// Convert date to ISO string
										// eslint-disable-next-line @typescript-eslint/no-unsafe-return
										.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
										// Wrap id in brackets
										// eslint-disable-next-line @typescript-eslint/no-unsafe-return
										.map((value) => (typeof value === 'string' && value.includes(id) ? value.replace(id, `[${id}]`) : value)),
								);

								console.error(
									// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
									...responseErrorItems
										// Convert date to ISO string
										// eslint-disable-next-line @typescript-eslint/no-unsafe-return
										.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
										// Wrap id in brackets
										// eslint-disable-next-line @typescript-eslint/no-unsafe-return
										.map((value) => (typeof value === 'string' && value.includes(id) ? value.replace(id, `[${id}]`) : value)),
								);
							}
						}

						resolve(response);
					})
					.catch(reject),
			);
		});
	}

	/**
	 * Removes sensitive headers from the provided `Headers` object. Specifically, it deletes the `Set-Cookie` and `Authorization` headers.
	 *
	 * @param originalHeaders - The original `Headers` object to sanitize. Defaults to an empty `Headers` object if not provided.
	 * @returns A new `Headers` object with the sensitive headers removed.
	 */
	public static stripSensitiveHeaders(originalHeaders: Headers = new Headers()) {
		const mutableHeaders = new Headers(originalHeaders);

		mutableHeaders.delete('Set-Cookie');
		if (mutableHeaders.has('Authorization')) {
			const split = mutableHeaders.get('Authorization')!.split(' ');

			if (split.length > 1) {
				const [scheme, ...parameters] = split;
				const maskedValue = parameters.join(' ').replaceAll(/./g, '*');
				mutableHeaders.set('Authorization', `${scheme} ${maskedValue}`);
			} else {
				mutableHeaders.delete('Authorization');
			}
		}
		if (mutableHeaders.has('cf-aig-authorization')) {
			const split = mutableHeaders.get('cf-aig-authorization')!.split(' ');

			if (split.length > 1) {
				const [scheme, ...parameters] = split;
				const maskedValue = parameters.join(' ').replaceAll(/./g, '*');
				mutableHeaders.set('cf-aig-authorization', `${scheme} ${maskedValue}`);
			} else {
				mutableHeaders.delete('cf-aig-authorization');
			}
		}

		return mutableHeaders;
	}

	/**
	 * Determines if the given object is a `Request`-like object.
	 *
	 * This function checks if the provided object has a `url` property of type `string`,
	 * which is a characteristic of the `Request` object used in the Fetch API.
	 *
	 * @param obj - The object to check, typically the first parameter of the `fetch` function.
	 * @returns A boolean indicating whether the object is a `Request` instance.
	 */
	public static isRequestLike(obj: Parameters<typeof fetch>[0]): obj is Request {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
		return typeof (obj as any)?.url === 'string';
	}

	/**
	 * Returns a promise that resolves to a `chalk` instance with a color corresponding to the provided HTTP method.
	 *
	 * The colors are based on the Swagger UI method colors:
	 * @link https://github.com/swagger-api/swagger-ui/blob/master/src/style/_variables.scss#L48-L55
	 *
	 * @param method - The HTTP method for which to retrieve the color.
	 * @returns A promise that resolves to a `chalk` instance with the color corresponding to the provided HTTP method.
	 * @throws An error if the provided method is unsupported.
	 */
	public static methodColors(method: Methods) {
		return import('chalk').then(({ Chalk }) => {
			const chalk = new Chalk({ level: 2 });

			/**
			 * @link https://github.com/swagger-api/swagger-ui/blob/master/src/style/_variables.scss#L48-L55
			 */
			switch (method) {
				case Methods.GET:
					return chalk.hex('#61affe');
				case Methods.HEAD:
					return chalk.hex('#9012fe');
				case Methods.POST:
					return chalk.hex('#49cc90');
				case Methods.PUT:
					return chalk.hex('#fca130');
				case Methods.DELETE:
					return chalk.hex('#f93e3e');
				case Methods.OPTIONS:
					return chalk.hex('#0d5aa7');
				case Methods.PATCH:
					return chalk.hex('#50e3c2');
				default:
					throw new Error(`Unsupported method: ${method}`);
			}
		});
	}

	/**
	 * Parses the Server-Timing header and returns an object with the metrics.
	 * The object keys are the metric names (with optional descriptions), and the values are the duration of each metric or null if no duration is found.
	 *
	 * @param {string} [serverTimingHeader=''] - The Server-Timing header string.
	 * @returns {Record<string, number | null>} An object where keys are metric names (with optional descriptions) and values are the durations in milliseconds or null.
	 */
	public static serverTiming(serverTimingHeader = '') {
		const result: Record<string, number | null> = {};

		if (serverTimingHeader && serverTimingHeader.trim().length > 0) {
			// Split the header by comma to get each metric
			const metrics = serverTimingHeader.trim().split(',');

			metrics.forEach((metric) => {
				// Split each metric by semicolon to separate the name from other attributes
				const parts = metric.split(';').map((part) => part.trim());

				// Get the metric name
				const name = parts[0];

				// Find the 'dur' attribute and convert it to a number
				const durationPart = parts.find((part) => part.startsWith('dur='));
				const duration = durationPart ? parseFloat(durationPart.split('=')[1]!) : null;

				// Optionally find the 'desc' attribute
				const descriptionPart = parts.find((part) => part.startsWith('desc='));
				const description = descriptionPart ? descriptionPart.split('=')[1] : null;

				// Construct the key name with optional description
				const keyName = description ? `${name} (${description})` : name;

				if (name) {
					result[keyName!] = duration;
				}
			});
		}

		return result;
	}

	public static withRetryInit() {
		return import('zod/v4').then(({ z: z4 }) =>
			z4
				.object({
					maxRetries: z4.int().nonnegative().default(3),
					initialDelay: z4.int().nonnegative().default(100),
					maxDelay: z4.int().nonnegative().default(1000),
					backoffFactor: z4.int().nonnegative().default(2),
				})
				.default({
					maxRetries: 3,
					initialDelay: 100,
					maxDelay: 1000,
					backoffFactor: 2,
				}),
		);
	}

	/**
	 * Executes an asynchronous operation with configurable retry logic.
	 *
	 * The operation function can be a simple parameterless function or a function that has been bound with arguments (using .bind(), arrow functions, or closures).
	 *
	 * @param operation - A function that returns a Promise. Arguments should be bound/captured beforehand.
	 * @param config - Optional retry configuration
	 * @returns Promise that resolves to the result of the operation
	 *
	 * @example
	 * // Simple function with no arguments
	 * await NetHelpers.withRetry(() => fetch('/api/data'))
	 *
	 * @example
	 * // Function with arguments using arrow function closure
	 * await NetHelpers.withRetry(() => fetch(url, options))
	 *
	 * @example
	 * // Function with arguments using .bind()
	 * await NetHelpers.withRetry(fetch.bind(null, url, options))
	 *
	 * @example
	 * // With custom retry configuration
	 * await NetHelpers.withRetry(() => apiCall(), { maxRetries: 5, initialDelay: 200 })
	 */
	public static withRetry<T>(operation: () => Promise<T>, config?: z4.input<Awaited<ReturnType<typeof NetHelpers.withRetryInit>>>): Promise<T> {
		return Promise.all([NetHelpers.withRetryInit().then((parser) => parser.parseAsync(config)), import('./common.mjs')]).then(async ([config, { Helpers }]) => {
			let lastError: unknown;
			let delay = config.initialDelay;

			for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
				try {
					const result = await operation();
					return result;
				} catch (error) {
					lastError = error;

					if (attempt === config.maxRetries) {
						throw error;
					}

					// Add randomness to avoid synchronizing retries
					// Wait for a random delay between delay and delay*2
					await Helpers.sleep(delay * (1 + Math.random()));

					// Calculate next delay with exponential backoff
					delay = Math.min(delay * config.backoffFactor, config.maxDelay);
				}
			}

			throw lastError;
		});
	}
}
