import type { UndefinedProperties } from '@chainfuse/types';
import type { UuidExport } from '@chainfuse/types/d1';
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { timingSafeEqual } from 'node:crypto';
import { describe, it } from 'node:test';
import * as zm from 'zod/mini';
import { BufferHelpersInternals } from '../dist/bufferInternals.mjs';
import { BufferHelpers } from '../dist/buffers.mjs';

void describe('Buffer Helper Tests', () => {
	void describe('UUID 7 Converter', async () => {
		void it(`Convert from ${undefined} using ${undefined} to ${undefined}`, async () => {
			deepStrictEqual({ blob: undefined, hex: undefined, utf8: undefined, base64: undefined, base64url: undefined } satisfies UndefinedProperties<UuidExport>, await BufferHelpers.uuidConvert(undefined));
		});

		const uuid = await BufferHelpers.generateUuid7();
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

	void describe('UUID Generation Tests', () => {
		void describe('UUID v7 Generation', () => {
			void it('generates a valid UUID v7', async () => {
				const uuid = await BufferHelpers.generateUuid7();

				// Check all required fields are present
				ok(uuid.utf8, 'Should have utf8 field');
				ok(uuid.hex, 'Should have hex field');
				ok(uuid.blob, 'Should have blob field');
				ok(uuid.base64, 'Should have base64 field');
				ok(uuid.base64url, 'Should have base64url field');

				// Validate UUID v7 format using Zod
				const result = zm.uuid({ version: 'v7' }).safeParse(uuid.utf8);
				ok(result.success, `Expected valid UUID v7, got: ${uuid.utf8}`);

				// Check hex is 32 characters (no hyphens)
				strictEqual(uuid.hex.length, 32);
				ok(/^[0-9a-f]{32}$/i.test(uuid.hex), 'Hex should contain only hex characters');

				// Check blob is 16 bytes
				ok(uuid.blob instanceof ArrayBuffer, 'Blob should be ArrayBuffer');
				strictEqual(uuid.blob.byteLength, 16);
			});

			void it('generates different UUIDs on multiple calls to generateUuid7', async () => {
				const uuid1 = await BufferHelpers.generateUuid7();
				const uuid2 = await BufferHelpers.generateUuid7();

				ok(uuid1.utf8 !== uuid2.utf8, 'UUIDs should be different');
				ok(uuid1.hex !== uuid2.hex, 'Hex values should be different');
			});

			void it('generates UUIDs with recent timestamps using generateUuid7', async () => {
				const beforeGeneration = Date.now();
				const uuid = await BufferHelpers.generateUuid7();
				const afterGeneration = Date.now();

				// Extract timestamp from UUID v7 (first 48 bits)
				const timestampHex = uuid.hex.substring(0, 12);
				const timestamp = Number(BigInt(`0x${timestampHex}`));

				// Timestamp should be within reasonable range of generation time
				ok(timestamp >= beforeGeneration - 1000, 'Timestamp should not be too far in the past');
				ok(timestamp <= afterGeneration + 1000, 'Timestamp should not be too far in the future');
			});

			void it('generates UUID v7 with custom date', async () => {
				const customDate = new Date('2023-06-15T12:30:45.123Z');
				const uuid = await BufferHelpers.generateUuid7({
					msecs: customDate,
				});

				// Check all required fields are present
				ok(uuid.utf8, 'Should have utf8 field');
				ok(uuid.hex, 'Should have hex field');
				ok(uuid.blob, 'Should have blob field');
				ok(uuid.base64, 'Should have base64 field');
				ok(uuid.base64url, 'Should have base64url field');

				// Validate UUID v7 format using Zod
				const result = zm.uuid({ version: 'v7' }).safeParse(uuid.utf8);
				ok(result.success, `Expected valid UUID v7, got: ${uuid.utf8}`);

				// Extract timestamp from UUID v7 (first 48 bits)
				const timestampHex = uuid.hex.substring(0, 12);
				const timestamp = Number(BigInt(`0x${timestampHex}`));

				// Timestamp should match the custom date
				strictEqual(timestamp, customDate.getTime(), 'UUID should contain the custom timestamp');
			});
		});
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

		void it('Convert from bigint to hex', async () => {
			const input = BigInt(`0x${crypto.getRandomValues(new Uint8Array(16)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')}`);
			const hex = await BufferHelpers.bigintToHex(input);
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
		void describe('Node native tests', () => {
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
				const convertedView = new Uint8Array(convertedBuffer);
				for (let i = 0; i < originalData.length; i++) {
					strictEqual(convertedView[i], originalData[i], `Byte at index ${i} should match`);
				}
			});
		});

		void describe('Browser tests', () => {
			void it('Convert from hex to buffer (browser fallback)', () => {
				const originalData = crypto.getRandomValues(new Uint8Array(16));
				const originalBuffer = originalData.buffer;
				const hex = Array.from(new Uint8Array(originalBuffer))
					.map((byte) => byte.toString(16).padStart(2, '0'))
					.join('');
				const convertedBuffer = BufferHelpersInternals.browser_hexToBuffer(hex);

				ok(convertedBuffer instanceof ArrayBuffer, 'Result should be an ArrayBuffer');
				const originalView = new Uint8Array(originalBuffer);
				const convertedView = new Uint8Array(convertedBuffer);
				strictEqual(convertedView.length, originalView.length);
				for (let i = 0; i < originalView.length; i++) {
					strictEqual(convertedView[i], originalView[i], `Byte at index ${i} should match`);
				}
			});

			void it('Convert from buffer to hex (browser fallback)', () => {
				const originalData = crypto.getRandomValues(new Uint8Array(20));
				const buffer = originalData.buffer;
				const hex = BufferHelpersInternals.browser_bufferToHex(buffer);

				ok(typeof hex === 'string', 'Result should be a string');
				strictEqual(hex.length, buffer.byteLength * 2, 'Hex length should be double buffer length');
				ok(/^[0-9a-f]+$/i.test(hex), 'Hex should contain only hex characters');
			});

			void it('Round-trip conversion hex (browser fallback)', () => {
				const originalData = crypto.getRandomValues(new Uint8Array(16));
				const originalBuffer = originalData.buffer;

				const hex = BufferHelpersInternals.browser_bufferToHex(originalBuffer);
				const convertedBuffer = BufferHelpersInternals.browser_hexToBuffer(hex);

				strictEqual(convertedBuffer.byteLength, originalBuffer.byteLength);
				const convertedView = new Uint8Array(convertedBuffer);
				for (let i = 0; i < originalData.length; i++) {
					strictEqual(convertedView[i], originalData[i], `Byte at index ${i} should match`);
				}
			});
		});
	});

	void describe('Base64 Conversion Tests', () => {
		void describe('Node native tests', () => {
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
				const convertedView = new Uint8Array(convertedBuffer);
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
				const convertedView = new Uint8Array(convertedBuffer);
				for (let i = 0; i < originalData.length; i++) {
					strictEqual(convertedView[i], originalData[i], `Byte at index ${i} should match`);
				}
			});
		});

		void describe('Browser tests', () => {
			void it('Convert from base64 to buffer (browser fallback)', () => {
				const originalData = crypto.getRandomValues(new Uint8Array(24));
				const originalBuffer = originalData.buffer;
				// Create base64 manually for browser test
				const base64 = btoa(
					Array.from(new Uint8Array(originalBuffer))
						.map((byte) => String.fromCharCode(byte))
						.join(''),
				);
				const convertedBuffer = BufferHelpersInternals.browser_base64ToBuffer(base64);

				ok(convertedBuffer instanceof ArrayBuffer, 'Result should be an ArrayBuffer');
				strictEqual(convertedBuffer.byteLength, originalBuffer.byteLength);

				const originalView = new Uint8Array(originalBuffer);
				const convertedView = new Uint8Array(convertedBuffer);
				for (let i = 0; i < originalView.length; i++) {
					strictEqual(originalView[i], convertedView[i], `Byte at index ${i} should match`);
				}
			});

			void it('Convert from base64url to buffer (browser fallback)', () => {
				const originalData = crypto.getRandomValues(new Uint8Array(24));
				const originalBuffer = originalData.buffer;
				// Create base64url manually for browser test
				const base64 = btoa(
					Array.from(new Uint8Array(originalBuffer))
						.map((byte) => String.fromCharCode(byte))
						.join(''),
				);
				const base64url = base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
				const convertedBuffer = BufferHelpersInternals.browser_base64UrlToBuffer(base64url);

				ok(convertedBuffer instanceof ArrayBuffer, 'Result should be an ArrayBuffer');
				strictEqual(convertedBuffer.byteLength, originalBuffer.byteLength);

				const originalView = new Uint8Array(originalBuffer);
				const convertedView = new Uint8Array(convertedBuffer);
				for (let i = 0; i < originalView.length; i++) {
					strictEqual(originalView[i], convertedView[i], `Byte at index ${i} should match`);
				}
			});

			void it('Convert from buffer to base64 (browser fallback)', () => {
				const originalData = crypto.getRandomValues(new Uint8Array(32));
				const buffer = originalData.buffer;
				const base64 = BufferHelpersInternals.browser_bufferToBase64(buffer, false);

				ok(typeof base64 === 'string', 'Result should be a string');
				ok(base64.length > 0, 'Base64 string should not be empty');
				ok(!base64.includes('-') && !base64.includes('_'), 'Standard base64 should not contain URL-safe characters');
			});

			void it('Convert from buffer to base64url (browser fallback)', () => {
				const originalData = crypto.getRandomValues(new Uint8Array(40));
				const buffer = originalData.buffer;
				const base64url = BufferHelpersInternals.browser_bufferToBase64(buffer, true);

				ok(typeof base64url === 'string', 'Result should be a string');
				ok(base64url.length > 0, 'Base64url string should not be empty');
				ok(!base64url.includes('+') && !base64url.includes('/') && !base64url.includes('='), 'Base64url should not contain standard base64 characters');
			});

			void it('Round-trip conversion base64 (browser fallback)', () => {
				const originalData = crypto.getRandomValues(new Uint8Array(32));
				const originalBuffer = originalData.buffer;

				const base64 = BufferHelpersInternals.browser_bufferToBase64(originalBuffer, false);
				const convertedBuffer = BufferHelpersInternals.browser_base64ToBuffer(base64);

				strictEqual(convertedBuffer.byteLength, originalBuffer.byteLength);
				const convertedView = new Uint8Array(convertedBuffer);
				for (let i = 0; i < originalData.length; i++) {
					strictEqual(convertedView[i], originalData[i], `Byte at index ${i} should match`);
				}
			});

			void it('Round-trip conversion base64url (browser fallback)', () => {
				const originalData = crypto.getRandomValues(new Uint8Array(32));
				const originalBuffer = originalData.buffer;

				const base64url = BufferHelpersInternals.browser_bufferToBase64(originalBuffer, true);
				const convertedBuffer = BufferHelpersInternals.browser_base64UrlToBuffer(base64url);

				strictEqual(convertedBuffer.byteLength, originalBuffer.byteLength);
				const convertedView = new Uint8Array(convertedBuffer);
				for (let i = 0; i < originalData.length; i++) {
					strictEqual(convertedView[i], originalData[i], `Byte at index ${i} should match`);
				}
			});
		});
	});

	void describe('UUID Extractor Tests', () => {
		void describe('UUID v7 Extraction', () => {
			void it('extracts date from UUID v7', async () => {
				const customDate = new Date('2023-06-15T12:30:45.123Z');
				const uuid = await BufferHelpers.generateUuid7({
					msecs: customDate,
				});

				const extracted = await BufferHelpers.uuidExtractor(uuid.utf8);

				// Should extract the correct date
				ok(extracted.date instanceof Date, 'Should extract a Date object');
				strictEqual(extracted.date.getTime(), customDate.getTime(), 'Should extract the correct timestamp');

				// Should only have date property for v7
				strictEqual(Object.keys(extracted).length, 1, 'UUID v7 extract should only have date property');
				ok('date' in extracted, 'Should have date property');
				ok(!('location' in extracted), 'Should not have location property');
				ok(!('shardType' in extracted), 'Should not have shardType property');
				ok(!('suffix' in extracted), 'Should not have suffix property');
			});

			void it('extracts date from recent UUID v7', async () => {
				const beforeGeneration = Date.now();
				const uuid = await BufferHelpers.generateUuid7();
				const afterGeneration = Date.now();

				const extracted = await BufferHelpers.uuidExtractor(uuid.utf8);

				// Should extract a date within reasonable range
				ok(extracted.date instanceof Date, 'Should extract a Date object');
				const extractedTime = extracted.date.getTime();
				ok(extractedTime >= beforeGeneration - 1000, 'Extracted date should not be too far in the past');
				ok(extractedTime <= afterGeneration + 1000, 'Extracted date should not be too far in the future');
			});

			void it('extracts from UUID v7 hex format', async () => {
				const customDate = new Date('2023-01-01T00:00:00.000Z');
				const uuid = await BufferHelpers.generateUuid7({
					msecs: customDate,
				});

				const extracted = await BufferHelpers.uuidExtractor(uuid.hex);

				ok(extracted.date instanceof Date, 'Should extract a Date object');
				strictEqual(extracted.date.getTime(), customDate.getTime(), 'Should extract the correct timestamp');
			});

			void it('extracts from UUID v7 blob format', async () => {
				const customDate = new Date('2023-12-25T10:15:30.500Z');
				const uuid = await BufferHelpers.generateUuid7({
					msecs: customDate,
				});

				const extracted = await BufferHelpers.uuidExtractor(uuid.blob);

				ok(extracted.date instanceof Date, 'Should extract a Date object');
				strictEqual(extracted.date.getTime(), customDate.getTime(), 'Should extract the correct timestamp');
			});
		});

		void describe('UUID Extractor Error Handling', () => {
			void it('throws error for invalid UUID', async () => {
				try {
					await BufferHelpers.uuidExtractor('invalid-uuid-string');
					ok(false, 'Should have thrown an error for invalid UUID');
				} catch (error) {
					ok(error instanceof Error, 'Should throw an Error');
					ok(error.message.includes('Invalid UUID provided') || error.message.includes('Unsupported UUID version'), 'Should have appropriate error message');
				}
			});

			void it('throws error for unsupported UUID version', async () => {
				// Generate a UUID v4 (unsupported)
				const { v4: uuidv4 } = await import('uuid');
				const v4Uuid = uuidv4();

				try {
					await BufferHelpers.uuidExtractor(v4Uuid);
					ok(false, 'Should have thrown an error for UUID v4');
				} catch (error) {
					ok(error instanceof Error, 'Should throw an Error');
					strictEqual(error.message, 'Unsupported UUID version provided', 'Should have correct error message');
				}
			});

			void it('throws error for malformed hex input', async () => {
				try {
					await BufferHelpers.uuidExtractor('not-hex-at-all-just-text-string');
					ok(false, 'Should have thrown an error for malformed hex');
				} catch (error) {
					ok(error instanceof Error, 'Should throw an Error');
				}
			});
		});

		void describe('UUID Extractor Input Format Tests', () => {
			void it('works with base64 UUID input', async () => {
				const customDate = new Date('2023-06-15T12:30:45.123Z');
				const uuid = await BufferHelpers.generateUuid7({
					msecs: customDate,
				});

				const extracted = await BufferHelpers.uuidExtractor(uuid.base64);

				ok(extracted.date instanceof Date, 'Should extract a Date object from base64');
				strictEqual(extracted.date.getTime(), customDate.getTime(), 'Should extract correct timestamp from base64');
			});
		});
	});
});
