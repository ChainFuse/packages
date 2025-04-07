import type { CustomLoging } from '@chainfuse/types';

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
		originalHeaders.delete('Set-Cookie');
		originalHeaders.delete('Authorization');

		return originalHeaders;
	}

	public static cfApi(apiKey: string, logger: CustomLoging = false) {
		return import('cloudflare').then(
			({ Cloudflare }) =>
				new Cloudflare({
					apiToken: apiKey,
					fetch: async (info, init) => {
						if (typeof logger === 'boolean' && logger) {
							logger = (date: string, id: string, methodOrStatus: string | number, url: string, headers: Record<string, string>) => {
								const customUrl = new URL(url);

								const loggingItems = [date, id, methodOrStatus, `${customUrl.pathname}${customUrl.search}${customUrl.hash}`];

								const customHeaders = new Headers(headers);
								if (customHeaders.has('cf-ray')) loggingItems.splice(3, 0, customHeaders.get('cf-ray')!);

								console.debug(...loggingItems);
							};
						}

						return this.loggingFetch(info, init, undefined, logger);
					},
				}),
		);
	}

	private static isRequestLike(obj: Parameters<typeof fetch>[0]): obj is Request {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
		return typeof (obj as any)?.url === 'string';
	}

	public static loggingFetch(info: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1], body = false, logger: CustomLoging = false) {
		return import('./crypto.mts')
			.then(({ CryptoHelpers }) => CryptoHelpers.base62secret(8))
			.then(async (id) => {
				if (typeof logger === 'boolean') {
					if (logger) {
						await Promise.all([import('chalk'), import('./index.mts')])
							.then(([{ Chalk }, { Helpers }]) => {
								const chalk = new Chalk({ level: 1 });

								console.debug(new Date().toISOString(), chalk.rgb(...Helpers.uniqueIdColor(id))(`[${id}]`), init?.method ?? 'GET', this.isRequestLike(info) ? info.url : info.toString());
							})
							.catch(() => console.debug(new Date().toISOString(), `[${id}]`, init?.method ?? 'GET', this.isRequestLike(info) ? info.url : info.toString()));
					}
				} else {
					logger(new Date().toISOString(), id, init?.method ?? 'GET', this.isRequestLike(info) ? info.url : info.toString(), Object.fromEntries(this.stripSensitiveHeaders(new Headers(init?.headers)).entries()), this.initBodyTrimmer(init));
				}

				return id;
			})
			.then(
				(id) =>
					// eslint-disable-next-line @typescript-eslint/no-misused-promises
					new Promise<Awaited<ReturnType<typeof fetch>>>((resolve, reject) =>
						fetch(info, init)
							.then(async (response) => {
								resolve(response.clone());

								let loggingContentBody: object | string | undefined;
								if (body) {
									if (response.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
										// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
										loggingContentBody = await response.json();
									} else {
										loggingContentBody = await response.text();
									}
								}

								if (typeof logger === 'boolean') {
									if (logger) {
										await Promise.all([import('chalk'), import('./index.mts')])
											.then(([{ Chalk }, { Helpers }]) => {
												const chalk = new Chalk({ level: 1 });

												console.debug(new Date().toISOString(), chalk.rgb(...Helpers.uniqueIdColor(id))(`[${id}]`), response.status, response.url);
											})
											.catch(() => console.debug(new Date().toISOString(), `[${id}]`, response.status, response.url));
									}
								} else {
									logger(new Date().toISOString(), id, response.status, response.url, Object.fromEntries(this.stripSensitiveHeaders(response.headers).entries()), loggingContentBody);
								}
							})
							.catch(reject),
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
