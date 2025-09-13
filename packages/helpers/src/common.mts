import type { Request as CfRequest, WorkerVersionMetadata } from '@cloudflare/workers-types/experimental';
import type { Chalk } from 'chalk';

interface QwikCityPlatform {
	request?: CfRequest;
}

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

	private static isWorkerVersionMetadata<P extends QwikCityPlatform>(metadata: WorkerVersionMetadata | P): metadata is WorkerVersionMetadata {
		return 'id' in metadata;
	}

	/**
	 * Determines if the provided object is running local based on its type and properties.
	 *
	 * For `WorkerVersionMetadata`, it checks if the `timestamp` property is absent.
	 * For `QwikCityPlatform`, it checks if the `request` property is absent.
	 *
	 * @param metadataOrPlatform - The object to evaluate, which can be either `WorkerVersionMetadata` or `QwikCityPlatform`.
	 * @returns `true` if the running local, otherwise `false`.
	 */
	public static isLocal<P extends QwikCityPlatform>(metadataOrPlatform: WorkerVersionMetadata | P) {
		if (this.isWorkerVersionMetadata(metadataOrPlatform)) {
			return !('timestamp' in metadataOrPlatform);
		} else {
			return !('request' in metadataOrPlatform);
		}
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
}
