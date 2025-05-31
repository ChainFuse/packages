import type { UndefinedProperties } from '@chainfuse/types';
import type { UuidExport } from '@chainfuse/types/d1';
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
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
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

	void describe('Hex Conversion Tests', () => {
		void it('Convert from hex to buffer', async () => {
			const originalData = crypto.getRandomValues(new Uint8Array(16));
			const originalBuffer = originalData.buffer;
			const hex = await BufferHelpers.bufferToHex(originalBuffer);
			const convertedBuffer = await BufferHelpers.hexToBuffer(hex);

			ok(convertedBuffer instanceof ArrayBuffer, 'Result should be an ArrayBuffer');
			const originalView = new Uint8Array(originalBuffer);
			const convertedView = new Uint8Array(convertedBuffer);
			strictEqual(convertedView.length, originalView.length);
			for (let i = 0; i < originalView.length; i++) {
				strictEqual(convertedView[i], originalView[i], `Byte at index ${i} should match`);
			}
		});

		void it('Convert from buffer to hex', async () => {
			const originalData = crypto.getRandomValues(new Uint8Array(20));
			const buffer = originalData.buffer;
			const hex = await BufferHelpers.bufferToHex(buffer);

			ok(typeof hex === 'string', 'Result should be a string');
			strictEqual(hex.length, buffer.byteLength * 2, 'Hex length should be double buffer length');
			ok(/^[0-9a-f]+$/i.test(hex), 'Hex should contain only hex characters');
		});

		void it('Round-trip conversion hex', async () => {
			const originalData = crypto.getRandomValues(new Uint8Array(16));
			const originalBuffer = originalData.buffer;

			const hex = await BufferHelpers.bufferToHex(originalBuffer);
			const convertedBuffer = await BufferHelpers.hexToBuffer(hex);

			strictEqual(convertedBuffer.byteLength, originalBuffer.byteLength);
			const convertedView = new Uint8Array(convertedBuffer as ArrayBuffer);
			for (let i = 0; i < originalData.length; i++) {
				strictEqual(convertedView[i], originalData[i], `Byte at index ${i} should match`);
			}
		});
	});
});
