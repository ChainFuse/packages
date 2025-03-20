import type { UndefinedProperties, UuidExport } from '@chainfuse/types';
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { timingSafeEqual } from 'node:crypto';
import { describe, it } from 'node:test';
import { BufferHelpers } from '../dist/buffers.mjs';

void describe('Buffer Helper Tests', () => {
	void describe('UUID Converter', async () => {
		void it(`Convert from ${undefined} using ${undefined} to ${undefined}`, async () => {
			deepStrictEqual({ blob: undefined, hex: undefined, utf8: undefined, base64: undefined, base64url: undefined } satisfies UndefinedProperties<UuidExport>, await BufferHelpers.uuidConvert(undefined));
		});

		const uuid = await BufferHelpers.generateUuid;
		const encoder = new TextEncoder();

		for (const [baseType, baseValue] of Object.entries(uuid)) {
			for (const [startingType, startingValue] of Object.entries(uuid)) {
				for (const usingType of Object.keys(uuid)) {
					void it(`Convert from ${startingType} using ${usingType} to ${baseType}`, async () => {
						// @ts-expect-error ts can't infer when for-looping a type
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						const usingValue = (await BufferHelpers.uuidConvert((await BufferHelpers.uuidConvert(startingValue))[usingType]))[baseType];

						const baseBuffer = typeof baseValue === 'string' ? encoder.encode(baseValue).buffer : (baseValue as UuidExport['blob']);
						const usingBuffer = typeof usingValue === 'string' ? encoder.encode(usingValue).buffer : (usingValue as UuidExport['blob']);

						strictEqual(baseBuffer.byteLength, usingBuffer.byteLength);
						ok(timingSafeEqual(baseBuffer as unknown as Parameters<typeof timingSafeEqual>[0], usingBuffer as unknown as Parameters<typeof timingSafeEqual>[1]));

						if (usingType !== 'blob' && baseType !== 'blob') {
							strictEqual(baseValue, usingValue);
						}
					});
				}
			}
		}
	});

	void describe('BigInt Conversion Tests', () => {
		void it('Convert from bigint to buffer', async () => {
			const input = BigInt(`0x${crypto.getRandomValues(new Uint8Array(16)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')}`);
			const buffer = await BufferHelpers.bigintToBuffer(input);
			ok(buffer instanceof ArrayBuffer, 'Result should be an ArrayBuffer');
			const hex = await BufferHelpers.bufferToHex(buffer);
			strictEqual(hex, input.toString(16).padStart(input.toString(16).length % 2 === 0 ? 0 : 1, '0'));
		});

		void it('Convert from bigint to hex', () => {
			const input = BigInt(`0x${crypto.getRandomValues(new Uint8Array(16)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')}`);
			const hex = BufferHelpers.bigintToHex(input);
			strictEqual(hex, input.toString(16).padStart(input.toString(16).length % 2 === 0 ? 0 : 1, '0'));
		});

		void it('Convert from buffer to bigint', async () => {
			const input = BigInt(`0x${crypto.getRandomValues(new Uint8Array(16)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')}`);
			const buffer = await BufferHelpers.bigintToBuffer(input);
			const output = await BufferHelpers.bufferToBigint(buffer);
			strictEqual(output, input);
		});
	});
});
