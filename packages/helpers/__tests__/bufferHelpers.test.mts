import type { UndefinedProperties, UuidExport } from '@chainfuse/types';
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { timingSafeEqual } from 'node:crypto';
import { describe, it } from 'node:test';
import { BufferHelpers } from '../dist/buffers.mjs';

void describe('Buffer Helper Tests', () => {
	void describe('UUID Converter', async () => {
		void it(`Convert from ${undefined} using ${undefined} to ${undefined}`, async () => {
			deepStrictEqual({ blob: undefined, hex: undefined, utf8: undefined } satisfies UndefinedProperties<UuidExport>, await BufferHelpers.uuidConvert(undefined));
		});

		const uuid = await BufferHelpers.generateUuid;
		const encoder = new TextEncoder();

		for (const [baseType, baseValue] of Object.entries(uuid)) {
			for (const [startingType, startingValue] of Object.entries(uuid)) {
				for (const usingType of Object.keys(uuid)) {
					void it(`Convert from ${startingType} using ${usingType} to ${baseType}`, async () => {
						// @ts-expect-error ts can't infer when for-looping a type
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
						const usingValue = (await BufferHelpers.uuidConvert((await BufferHelpers.uuidConvert(startingValue))[usingType]))[baseType];

						if (usingType === 'blob' || baseType === 'blob') {
							const baseBuffer = typeof baseValue === 'string' ? encoder.encode(baseValue).buffer : (baseValue as UuidExport['blob']);
							const usingBuffer = typeof usingValue === 'string' ? encoder.encode(usingValue).buffer : (usingValue as UuidExport['blob']);

							strictEqual(baseBuffer.byteLength, usingBuffer.byteLength);
							ok(timingSafeEqual(baseBuffer as Parameters<typeof timingSafeEqual>[0], usingBuffer as Parameters<typeof timingSafeEqual>[1]));
						} else {
							strictEqual(baseValue, usingValue);
						}
					});
				}
			}
		}
	});
});
