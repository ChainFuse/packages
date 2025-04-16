import type { CustomLoging } from '@chainfuse/types';
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
	/**
	 * Removes the `body` property from a RequestInit object to reduce verbosity when logging.
	 *
	 * @param {RequestInit} [init={}] - The RequestInit object from which to remove the 'body' property. If not provided, an empty object will be used.
	 *
	 * @returns {RequestInit} The updated RequestInit object without the 'body' property.
	 */
	public static initBodyTrimmer(init: RequestInit = {}): RequestInit {
		if ('cf' in init) delete init.cf;
		delete init.body;
		return init;
	}

	public static stripSensitiveHeaders(originalHeaders: Headers = new Headers()) {
		const mutableHeaders = new Headers(originalHeaders);

		mutableHeaders.delete('Set-Cookie');
		mutableHeaders.delete('Authorization');

		return mutableHeaders;
	}

	public static cfApi(apiKey: string, logger: CustomLoging = false) {
		return import('cloudflare').then(
			({ Cloudflare }) =>
				new Cloudflare({
					apiToken: apiKey,
					fetch: async (info, init) => {
						if (typeof logger === 'boolean' && logger) {
							logger = async (date: string, id: string, methodOrStatus: string | number, url: string, headers: Record<string, string>, ...rest: any[]) => {
								const customUrl = new URL(url);

								// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
								const loggingItems = ['CF Rest', date, id, methodOrStatus, `${customUrl.pathname}${customUrl.search}${customUrl.hash}`, ...rest];
								const customHeaders = new Headers(headers);

								await import('chalk')
									.then(({ Chalk }) => {
										const chalk = new Chalk({ level: 2 });

										// Replace with color
										loggingItems.splice(0, 1, chalk.rgb(245, 130, 30)('CF Rest'));
										// Add in with color
										if (customHeaders.has('cf-ray')) loggingItems.splice(3, 0, chalk.rgb(245, 130, 30)(customHeaders.get('cf-ray')!));
									})
									.catch(() => {
										// Add in ray id
										if (customHeaders.has('cf-ray')) loggingItems.splice(3, 0, customHeaders.get('cf-ray')!);
									});

								// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
								console.debug(...loggingItems);
							};
						}

						return this.loggingFetch(info, init);
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
		return import('zod').then(({ z }) => {
			/**
			 * @link https://zod.dev/?id=json-type
			 */
			const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
			type Json = z.infer<typeof literalSchema> | { [key: string]: Json } | Json[];
			const jsonSchema: z.ZodType<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]));

			return z
				.discriminatedUnion('level', [
					z.object({
						level: z.literal(0),
					}),
					z.object({
						level: z.literal(1),
						color: z.boolean().default(true),
						custom: z
							.function()
							.args(
								//
								z.coerce.date(),
								z.string().length(10),
								z.union([z.nativeEnum(Methods), z.coerce.number().int().min(100).max(599)]),
								z.string().trim().nonempty().url(),
							)
							.returns(z.union([z.void(), z.promise(z.void())]))
							.optional(),
					}),
					z.object({
						level: z.literal(2),
						color: z.boolean().default(true),
						custom: z
							.function()
							.args(
								//
								z.coerce.date(),
								z.string().length(10),
								z.union([z.nativeEnum(Methods), z.coerce.number().int().min(100).max(599)]),
								z.string().trim().nonempty().url(),
								z.record(z.string().trim().nonempty(), z.string().trim().nonempty()),
							)
							.returns(z.union([z.void(), z.promise(z.void())]))
							.optional(),
					}),
					z.object({
						level: z.literal(3),
						color: z.boolean().default(true),
						custom: z
							.function()
							.args(
								//
								z.coerce.date(),
								z.string().length(10),
								z.union([z.nativeEnum(Methods), z.coerce.number().int().min(100).max(599)]),
								z.string().trim().nonempty().url(),
								z.record(z.string().trim().nonempty(), z.string().trim().nonempty()),
								z.union([jsonSchema.optional(), z.string(), z.array(z.number().int().min(0).max(255))]),
							)
							.returns(z.union([z.void(), z.promise(z.void())]))
							.optional(),
					}),
				])
				.default({
					level: 0,
				});
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
							const loggingItems: any[] = [new Date(), `[${id}]`, init?.method ?? Methods.GET, this.isRequestLike(info) ? info.url : info.toString()];

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

							if (init.logging.color) {
								await Promise.all([import('chalk'), import('./index.mts')])
									.then(([{ Chalk }, { Helpers }]) => {
										const chalk = new Chalk({ level: 2 });

										loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(id))(`[${id.slice(1, -1)}]`));

										const initMethod = loggingItems[2] as Methods;
										/**
										 * @link https://github.com/swagger-api/swagger-ui/blob/master/src/style/_variables.scss#L48-L55
										 */
										switch (initMethod) {
											case Methods.GET:
												loggingItems.splice(2, 1, chalk.hex('#61affe')(initMethod));
												break;
											case Methods.HEAD:
												loggingItems.splice(2, 1, chalk.hex('#9012fe')(initMethod));
												break;
											case Methods.POST:
												loggingItems.splice(2, 1, chalk.hex('#49cc90')(initMethod));
												break;
											case Methods.PUT:
												loggingItems.splice(2, 1, chalk.hex('#fca130')(initMethod));
												break;
											case Methods.DELETE:
												loggingItems.splice(2, 1, chalk.hex('#f93e3e')(initMethod));
												break;
											case Methods.OPTIONS:
												loggingItems.splice(2, 1, chalk.hex('#0d5aa7')(initMethod));
												break;
											case Methods.PATCH:
												loggingItems.splice(2, 1, chalk.hex('#50e3c2')(initMethod));
												break;
										}
									})
									// eslint-disable-next-line @typescript-eslint/no-empty-function
									.catch(() => {});
							}

							if (init.logging.custom) {
								// @ts-expect-error logging items type is fine
								// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
								await init.logging.custom(...loggingItems);
							} else {
								// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
								console.debug(...loggingItems);
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
											const loggingItems: any[] = [new Date(), `[${id}]`, response.status, response.url];

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

											if (init.logging.color) {
												await Promise.all([import('chalk'), import('./index.mts')])
													.then(([{ Chalk }, { Helpers }]) => {
														const chalk = new Chalk({ level: 2 });

														loggingItems.splice(1, 1, chalk.rgb(...Helpers.uniqueIdColor(id))(`[${id.slice(1, -1)}]`));
														loggingItems.splice(2, 1, response.ok ? chalk.green(response.status) : chalk.red(response.status));
													})
													// eslint-disable-next-line @typescript-eslint/no-empty-function
													.catch(() => {});
											}

											if (init.logging.custom) {
												// @ts-expect-error logging items type is fine
												// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
												await init.logging.custom(...loggingItems);
											} else {
												// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
												console.debug(...loggingItems);
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
