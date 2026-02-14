import type { Chalk } from 'chalk';

export class Helpers {
	/**
	 * Generates a unique RGB color based unique to the provided string ID. The RGB values are clamped to a range that ensures the resulting color is legible
	 *
	 * @param id - The input string used to generate the unique color.
	 * @returns A tuple containing the RGB values [r, g, b].
	 */
	public static uniqueIdColor(id: string): Parameters<InstanceType<typeof Chalk>['rgb']> {
		// Hash the string to a numeric value
		let hash = 0;
		for (let i = 0; i < id.length; i++) {
			const char = id.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash |= 0; // Convert to 32-bit integer
		}

		// Convert the hash to RGB components
		let r = (hash & 0xff0000) >> 16; // Extract red
		let g = (hash & 0x00ff00) >> 8; // Extract green
		let b = hash & 0x0000ff; // Extract blue

		// Clamp RGB values to a more legible range (e.g., 64-200)
		const clamp = (value: number) => Math.max(100, Math.min(222, value));
		r = clamp(r);
		g = clamp(g);
		b = clamp(b);

		return [r, g, b];
	}

	public static precisionFloat(input: string) {
		if (!input.includes('.')) {
			// No decimal point means it's an integer, just return as a float
			return parseFloat(input);
		} else {
			if (input.endsWith('0')) {
				// Replace the last '0' with '1' while keeping other characters unchanged
				return parseFloat(input.substring(0, input.length - 1) + '1');
			} else {
				// If last decimal is not zero, parse as usual
				return parseFloat(input);
			}
		}
	}

	/**
	 * A wrapper around `Promise.allSettled()` that filters and returns only the fulfilled results. This method behaves like `Promise.allSettled()` where one promise failing doesn't stop others.
	 * However, like `Promise.all()`, it only returns the values of successfully fulfilled promises without needing to manually check their status.
	 *
	 * @param promises - An array of promises to be settled.
	 * @returns A promise that resolves to an array of fulfilled values from the input promises.
	 */
	public static getFulfilledResults<T extends unknown>(promises: PromiseLike<T>[]) {
		return Promise.allSettled(promises).then((results) => results.filter((result): result is PromiseFulfilledResult<Awaited<T>> => result.status === 'fulfilled').map((result) => result.value));
	}

	public static areArraysEqual<T>(array1: T[], array2: T[]) {
		// Quick length check for early exit
		if (array1.length !== array2.length) {
			return false;
		}

		// Use Set for efficient comparison if arrays are of primitive types
		const set1 = new Set(array1);
		const set2 = new Set(array2);

		if (set1.size !== set2.size) {
			return false;
		}

		for (const item of set1) {
			if (!set2.has(item)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Pauses execution for a specified number of milliseconds.
	 *
	 * @param ms - The number of milliseconds to sleep.
	 * @returns A promise that resolves after the specified delay.
	 */
	public static sleep(ms: number) {
		return new Promise<void>((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Replaces a substring in the input string between the specified start and end indices with the provided replacement string.
	 *
	 * @param input - The original string to modify.
	 * @param start - The starting index (inclusive) of the substring to replace.
	 * @param end - The ending index (exclusive) of the substring to replace.
	 * @param replacement - The string to insert in place of the specified substring.
	 * @returns The resulting string after replacement.
	 */
	public static replaceByIndex(input: string, start: number, end: number, replacement: string) {
		return input.slice(0, start) + replacement + input.slice(end);
	}

	/**
	 * Returns the number of milliseconds to wait before retrying a request.
	 * See the "Full Jitter" approach in https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/.
	 * @param attempt The number of attempts so far.
	 * @param baseDelayMs Number of milliseconds to use as multiplier for the exponential backoff.
	 * @param maxDelayMs Maximum number of milliseconds to wait.
	 * @returns Milliseconds to wait before retrying.
	 */
	public static jitterBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number) {
		const attemptUpperBoundMs = Math.min(2 ** attempt * baseDelayMs, maxDelayMs);
		return Math.floor(Math.random() * attemptUpperBoundMs);
	}

	/**
	 * @param fn The function to call for each attempt. Receives the attempt number.
	 * @param isRetryable The function to call to determine if the error is retryable. Receives the error and the next attempt number.
	 * @param options The options for the retry strategy.
	 * @param options.baseDelayMs Number of milliseconds to use as multiplier for the exponential backoff.
	 * @param options.maxDelayMs Maximum number of milliseconds to wait.
	 * @param options.verbose If true, logs the error and attempt number to the console.
	 * @returns The result of the `fn` function or propagates the last error thrown once `isRetryable` returns false or all retries failed.
	 */
	public static async tryWhile<T>(
		fn: (attempt: number) => Promise<T>,
		isRetryable: (err: unknown, nextAttempt: number) => boolean,
		options?: {
			baseDelayMs?: number;
			maxDelayMs?: number;

			verbose?: boolean;
		},
	) {
		const baseDelayMs = Math.floor(options?.baseDelayMs ?? 100);
		const maxDelayMs = Math.floor(options?.maxDelayMs ?? 3000);
		if (baseDelayMs <= 0 || maxDelayMs <= 0) {
			throw new Error('baseDelayMs and maxDelayMs must be greater than 0');
		}
		if (baseDelayMs >= maxDelayMs) {
			throw new Error('baseDelayMs must be less than maxDelayMs');
		}
		let attempt = 1;
		while (true) {
			try {
				return await fn(attempt);
			} catch (err) {
				if (options?.verbose) {
					console.info({
						message: 'tryWhile',
						attempt,
						error: String(err),
						errorProps: err,
					});
				}
				attempt += 1;
				if (!isRetryable(err, attempt)) {
					throw err;
				}
				const delay = this.jitterBackoff(attempt, baseDelayMs, maxDelayMs);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}
}
