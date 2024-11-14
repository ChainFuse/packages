import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Helpers } from '../dist/index.mjs';

void describe('Discord Helper Tests', () => {
	void describe('Snowflake generator', () => {
		const nowDate = new Date();

		void it(`Now (${nowDate.toISOString()})`, () => {
			const snowflake = Helpers.dateToDiscordSnowflake(nowDate);
			const originalDate = BigInt(nowDate.valueOf());
			const convertedDate = (snowflake >> BigInt(22)) + Helpers.discordEpoch;

			const snowflakeSize = snowflake.toString(2).length;
			ok(snowflakeSize > 0 && snowflakeSize <= 64, `Expected snowflake to be 64 bits, but got ${snowflakeSize} bits`);

			strictEqual(originalDate, convertedDate, `Expected ${originalDate.toString()} to be equal to ${convertedDate.toString()}`);
		});

		/**
		 * @param minDate Discord starts counting the first second of 2015
		 * @param maxDate Discord snowflake uses 42 bits for the timestamp
		 */
		function generate(minDate = new Date(Number(Helpers.discordEpoch)), maxDate = new Date(2 ** 42 - 1)) {
			const startTimestamp = minDate.getTime();
			const endTimestamp = maxDate.getTime();

			const minTimestamp = Math.min(startTimestamp, endTimestamp);
			const maxTimestamp = Math.max(startTimestamp, endTimestamp);

			return new Date(Math.random() * (maxTimestamp - minTimestamp) + minTimestamp);
		}

		for (let i = 0; i < 100; i++) {
			const date = new Date(generate());

			void it(date.toISOString(), () => {
				const snowflake = Helpers.dateToDiscordSnowflake(date);
				const originalDate = BigInt(date.valueOf());
				const convertedDate = (snowflake >> BigInt(22)) + Helpers.discordEpoch;

				const snowflakeSize = snowflake.toString(2).length;
				ok(snowflakeSize > 0 && snowflakeSize <= 64, `Expected snowflake to be 64 bits, but got ${snowflakeSize} bits`);

				strictEqual(originalDate, convertedDate, `Expected ${originalDate.toString()} to be equal to ${convertedDate.toString()}`);
			});
		}
	});
});
