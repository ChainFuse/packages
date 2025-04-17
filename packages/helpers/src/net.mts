import type { z } from 'zod';

export type LoggingFetchInitType<RI extends RequestInit = RequestInit> = RI & z.input<Awaited<ReturnType<typeof NetHelpers.loggingFetchInit>>>;
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
	public static stripSensitiveHeaders(originalHeaders: Headers = new Headers()) {
		const mutableHeaders = new Headers(originalHeaders);

		mutableHeaders.delete('Set-Cookie');
		mutableHeaders.delete('Authorization');

		return mutableHeaders;
	}

	public static cfApiLogging() {
		return import('zod').then(({ z }) =>
			z
				.union([
					z.object({
						level: z.literal(0),
					}),
					z.object({
						level: z.coerce.number().int().min(1).max(3),
						color: z.boolean().default(true),
						custom: z
							.function()
							.args()
							.returns(z.union([z.void(), z.promise(z.void())]))
							.optional(),
					}),
				])
				.default({
					level: 0,
				}),
		);
	}
	public static cfApi(apiKey: string, logging: z.input<Awaited<ReturnType<typeof NetHelpers.cfApiLogging>>>) {
		return Promise.all([
			//
			import('cloudflare'),
			NetHelpers.cfApiLogging().then((parser) => parser.parseAsync(logging)),
		]).then(
			([{ Cloudflare }, logging]) =>
				new Cloudflare({
					apiToken: apiKey,
					fetch: async (info, init) => {
						const loggingFetchInit: Parameters<typeof this.loggingFetch>[1] = {
							...init,
							logging: {
								// Fake level 1 as 2 to get headers for ray-id
								level: logging.level === 1 ? 2 : logging.level,
								...('color' in logging && { color: logging.color }),
								...(logging.level > 0 && {
									custom: async (...args: any[]) => {
										const [, id, , url, headers] = args as [Date, string, Methods | number, string, Record<string, string>];
										const customUrl = new URL(url);
										const customHeaders = new Headers(headers);

										if (customHeaders.has('cf-ray')) {
											args.splice(3, 0, customHeaders.get('cf-ray'));
										}

										if ('color' in logging && logging.color) {
											await import('chalk')
												.then(({ Chalk }) => {
													const chalk = new Chalk({ level: 2 });

													if (customHeaders.has('cf-ray')) {
														args.splice(3, 1, chalk.rgb(255, 102, 51)(customHeaders.get('cf-ray')));
													}
												})
												// eslint-disable-next-line @typescript-eslint/no-empty-function
												.catch(() => {});
										}

										if ('custom' in logging && logging.custom) {
											// We faked level 1 as 2 to get headers for ray-id
											if (logging.level === 1) {
												// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
												return logging.custom(...args.slice(0, -1));
											} else {
												// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
												return logging.custom(...args);
											}
										} else {
											await Promise.all([import('strip-ansi'), import('chalk'), import('./index.mts')]).then(([{ default: stripAnsi }, { Chalk }, { Helpers }]) => {
												const chalk = new Chalk({ level: 2 });

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
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value === id ? chalk.rgb(...Helpers.uniqueIdColor(stripAnsi(id)))(`[${stripAnsi(id)}]`) : value))
															// Strip out redundant parts of url
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value === url ? `${customUrl.pathname}${customUrl.search}${customUrl.hash}` : value)),
													);
												} else {
													console.info(
														'CF Rest',
														// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
														...args
															// Convert date to ISO string
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
															// Wrap id in brackets
															// eslint-disable-next-line @typescript-eslint/no-unsafe-return
															.map((value) => (value === id ? chalk.rgb(...Helpers.uniqueIdColor(stripAnsi(id)))(`[${stripAnsi(id)}]`) : value))
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

						return this.loggingFetch(info, loggingFetchInit);
					},
				}),
		);
	}

	public static isRequestLike(obj: Parameters<typeof fetch>[0]): obj is Request {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
		return typeof (obj as any)?.url === 'string';
	}

	public static loggingFetchInit() {
		return Promise.all([import('zod'), this.loggingFetchInitLogging()]).then(([{ z }, logging]) =>
			z.object({
				logging,
			}),
		);
	}
	public static loggingFetchInitLogging() {
		return import('zod').then(({ z }) =>
			z
				.union([
					z.object({
						level: z.literal(0),
					}),
					z.object({
						level: z.coerce.number().int().min(1).max(3),
						color: z.boolean().default(true),
						custom: z
							.function()
							// .args()
							.returns(z.union([z.void(), z.promise(z.void())]))
							.optional(),
					}),
				])
				.default({
					level: 0,
				}),
		);
	}

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

	public static loggingFetch<RI extends RequestInit = RequestInit>(info: Parameters<typeof fetch>[0], init?: LoggingFetchInitType<RI>) {
		return NetHelpers.loggingFetchInit()
			.then((parser) => parser.passthrough().parseAsync(init))
			.then((parsed) => parsed as unknown as RI & z.output<Awaited<ReturnType<typeof NetHelpers.loggingFetchInit>>>)
			.then((init) =>
				import('./crypto.mts')
					.then(({ CryptoHelpers }) => CryptoHelpers.base62secret(8))
					.then(async (id) => {
						if (init.logging.level) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const loggingItems: any[] = [new Date(), id, init?.method ?? Methods.GET, this.isRequestLike(info) ? info.url : info.toString()];

							if (init.logging.level >= 2) {
								loggingItems.push(Object.fromEntries(this.stripSensitiveHeaders(new Headers(init?.headers)).entries()) as Record<string, string>);
							}

							if (init.logging.level >= 3 && init?.body) {
								if (init.body instanceof ReadableStream) {
									loggingItems.push(Array.from(new Uint8Array(await new Response(init.body).arrayBuffer())));
								} else if (new Headers(init.headers).get('Content-Type')?.toLowerCase().startsWith('application/json')) {
									loggingItems.push(JSON.parse(init.body as string));
								} else {
									loggingItems.push(init.body);
								}
							}

							if ('color' in init.logging && init.logging.color) {
								await Promise.all([import('chalk'), import('./index.mts')])
									.then(([{ Chalk }, { Helpers }]) => {
										const chalk = new Chalk({ level: 2 });

										loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(id))(id));
									})
									// eslint-disable-next-line @typescript-eslint/no-empty-function
									.catch(() => {});

								await this.methodColors(loggingItems[2] as Methods)
									.then((color) => {
										if (color) {
											loggingItems.splice(2, 1, color(loggingItems[2]));
										}
									})
									// eslint-disable-next-line @typescript-eslint/no-empty-function
									.catch(() => {});
							}

							if ('custom' in init.logging && init.logging.custom) {
								// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
								await init.logging.custom(...loggingItems);
							} else {
								console.info(
									// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
									...loggingItems
										// Convert date to ISO string
										// eslint-disable-next-line @typescript-eslint/no-unsafe-return
										.map((value) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value))
										// Wrap id in brackets
										// eslint-disable-next-line @typescript-eslint/no-unsafe-return
										.map((value) => (typeof value === 'string' && value.includes(id) ? value.replace(id, `[${id}]`) : value)),
								);
							}
						}

						return id;
					})
					.then(
						(id) =>
							// eslint-disable-next-line @typescript-eslint/no-misused-promises
							new Promise<Awaited<ReturnType<typeof fetch>>>((resolve, reject) =>
								fetch(info, init)
									.then(async (response) => {
										if (init.logging.level) {
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											const loggingItems: any[] = [new Date(), id, response.status, response.url];

											if (init.logging.level >= 2) {
												loggingItems.push(Object.fromEntries(this.stripSensitiveHeaders(response.headers).entries()) as Record<string, string>);
											}

											if (init.logging.level >= 3 && init?.body) {
												const loggingClone = response.clone();

												if (response.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
													loggingItems.push(await loggingClone.json());
												} else {
													loggingItems.push(await loggingClone.text());
												}
												/**
												 * @todo @demosjarco detect if the body is a stream and convert it to an array
												 */
											}

											if ('color' in init.logging && init.logging.color) {
												await Promise.all([import('chalk'), import('./index.mts')])
													.then(([{ Chalk }, { Helpers }]) => {
														const chalk = new Chalk({ level: 2 });

														loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(id))(id));
														loggingItems.splice(2, 1, response.ok ? chalk.green(response.status) : chalk.red(response.status));
													})
													// eslint-disable-next-line @typescript-eslint/no-empty-function
													.catch(() => {});
											}

											if ('custom' in init.logging && init.logging.custom) {
												// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
												await init.logging.custom(...loggingItems);
											} else {
												console.info(
													// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
													...loggingItems
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
							),
					),
			);
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
}
