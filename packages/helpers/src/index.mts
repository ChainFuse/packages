export * from './buffers.mjs';
export * from './crypto.mjs';
export * from './net.mjs';

export class Helpers {
	/**
	 * Discord Epoch, the first second of 2015 or 1420070400000
	 * @link https://discord.com/developers/docs/reference#snowflakes
	 */
	public static readonly discordEpoch = BigInt(1420070400000);
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
}
