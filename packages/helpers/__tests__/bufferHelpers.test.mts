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
			const expectedHex = input.toString(16).length % 2 === 0 ? input.toString(16) : `0${input.toString(16)}`;
			strictEqual(hex, expectedHex);
		});

		void it('Convert from bigint to hex', () => {
			const input = BigInt(`0x${crypto.getRandomValues(new Uint8Array(16)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')}`);
			const hex = BufferHelpers.bigintToHex(input);
			const expectedHex = input.toString(16).length % 2 === 0 ? input.toString(16) : `0${input.toString(16)}`;
			strictEqual(hex, expectedHex);
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

	void describe('Base64 Conversion Tests', () => {
		void it('Convert from base64 to buffer', async () => {
			const originalData = crypto.getRandomValues(new Uint8Array(24));
			const originalBuffer = originalData.buffer;
			const base64 = await BufferHelpers.bufferToBase64(originalBuffer, false);
			const convertedBuffer = await BufferHelpers.base64ToBuffer(base64);

			ok(convertedBuffer instanceof ArrayBuffer, 'Result should be an ArrayBuffer');
			strictEqual(convertedBuffer.byteLength, originalBuffer.byteLength);

			const originalView = new Uint8Array(originalBuffer);
			const convertedView = new Uint8Array(convertedBuffer);
			for (let i = 0; i < originalView.length; i++) {
				strictEqual(originalView[i], convertedView[i], `Byte at index ${i} should match`);
			}
		});

		void it('Convert from base64url to buffer', async () => {
			const originalData = crypto.getRandomValues(new Uint8Array(48));
			const originalBuffer = originalData.buffer;
			const base64url = await BufferHelpers.bufferToBase64(originalBuffer, true);
			const convertedBuffer = await BufferHelpers.base64ToBuffer(base64url);

			ok(convertedBuffer instanceof ArrayBuffer, 'Result should be an ArrayBuffer');
			strictEqual(convertedBuffer.byteLength, originalBuffer.byteLength);

			const originalView = new Uint8Array(originalBuffer);
			const convertedView = new Uint8Array(convertedBuffer);
			for (let i = 0; i < originalView.length; i++) {
				strictEqual(originalView[i], convertedView[i], `Byte at index ${i} should match`);
			}
		});

		void it('Convert from buffer to base64', async () => {
			const originalData = crypto.getRandomValues(new Uint8Array(32));
			const buffer = originalData.buffer;
			const base64 = await BufferHelpers.bufferToBase64(buffer, false);

			ok(typeof base64 === 'string', 'Result should be a string');
			ok(base64.length > 0, 'Base64 string should not be empty');
			ok(!base64.includes('-') && !base64.includes('_'), 'Standard base64 should not contain URL-safe characters');
		});

		void it('Convert from buffer to base64url', async () => {
			const originalData = crypto.getRandomValues(new Uint8Array(40));
			const buffer = originalData.buffer;
			const base64url = await BufferHelpers.bufferToBase64(buffer, true);

			ok(typeof base64url === 'string', 'Result should be a string');
			ok(base64url.length > 0, 'Base64url string should not be empty');
			ok(!base64url.includes('+') && !base64url.includes('/') && !base64url.includes('='), 'Base64url should not contain standard base64 characters');
		});

		void it('Handle base64url with padding requirements', async () => {
			// Test base64url strings that need padding when converted back to standard base64
			const testCases = [
				'SGVsbG8', // Length % 4 === 3, needs 1 padding char
				'SGVsbG9X', // Length % 4 === 0, needs no padding
				'SGVsbG9Xb3JsZA', // Length % 4 === 2, needs 2 padding chars
			];

			for (const base64url of testCases) {
				const buffer = await BufferHelpers.base64ToBuffer(base64url);
				ok(buffer instanceof ArrayBuffer, `Result should be an ArrayBuffer for input: ${base64url}`);
				ok(buffer.byteLength > 0, `Buffer should not be empty for input: ${base64url}`);
			}
		});

		void it('Round-trip conversion base64', async () => {
			const originalData = crypto.getRandomValues(new Uint8Array(32));
			const originalBuffer = originalData.buffer;

			const base64 = await BufferHelpers.bufferToBase64(originalBuffer, false);
			const convertedBuffer = await BufferHelpers.base64ToBuffer(base64);

			strictEqual(convertedBuffer.byteLength, originalBuffer.byteLength);
			const convertedView = new Uint8Array(convertedBuffer as ArrayBuffer);
			for (let i = 0; i < originalData.length; i++) {
				strictEqual(convertedView[i], originalData[i], `Byte at index ${i} should match`);
			}
		});

		void it('Round-trip conversion base64url', async () => {
			const originalData = crypto.getRandomValues(new Uint8Array(32));
			const originalBuffer = originalData.buffer;

			const base64url = await BufferHelpers.bufferToBase64(originalBuffer, true);
			const convertedBuffer = await BufferHelpers.base64ToBuffer(base64url);

			strictEqual(convertedBuffer.byteLength, originalBuffer.byteLength);
			const convertedView = new Uint8Array(convertedBuffer as ArrayBuffer);
			for (let i = 0; i < originalData.length; i++) {
				strictEqual(convertedView[i], originalData[i], `Byte at index ${i} should match`);
			}
		});
	});
});
