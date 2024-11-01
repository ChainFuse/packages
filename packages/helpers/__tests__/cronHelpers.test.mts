import type { CronExport, UndefinedProperties } from '@chainfuse/types';
import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CronHelpers } from '../dist/cron.mjs';

void describe('Cron Helper Tests', () => {
	void describe('Cron Converter', async () => {
		void it(`Convert from ${undefined} using ${undefined} to ${undefined}`, () => {
			deepStrictEqual({ string: undefined, array: undefined, object: undefined } satisfies UndefinedProperties<CronExport>, CronHelpers.cronConvert(undefined));
		});

		const dailyCron: CronExport = {
			string: '0 0 0 * * *' as CronExport['string'],
			array: [[0], [0], [0], [1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 2, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 3, 30, 31, 4, 5, 6, 7, 8, 9], [1, 10, 11, 12, 2, 3, 4, 5, 6, 7, 8, 9], [0, 1, 2, 3, 4, 5, 6, 7]],
			object: {
				second: [0],
				minute: [0],
				hour: [0],
				dayOfMonth: [1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 2, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 3, 30, 31, 4, 5, 6, 7, 8, 9],
				month: [1, 10, 11, 12, 2, 3, 4, 5, 6, 7, 8, 9],
				dayOfWeek: [0, 1, 2, 3, 4, 5, 6, 7],
			},
		};

		for (const [baseType, baseValue] of Object.entries(dailyCron)) {
			for (const [startingType, startingValue] of Object.entries(dailyCron)) {
				for (const usingType of Object.keys(dailyCron)) {
					void it(`Convert from ${startingType} using ${usingType} to ${baseType}`, () => {
						// @ts-expect-error ts can't infer when for-looping a type
						const usingValue = CronHelpers.cronConvert(CronHelpers.cronConvert(startingValue)[usingType])[baseType];

						if (usingType === 'array' || baseType === 'array' || usingType === 'object' || baseType === 'object') {
							deepStrictEqual(baseValue, usingValue);
						} else {
							strictEqual(baseValue, usingValue);
						}
					});
				}
			}
		}
	});
});
