import type { UndefinedProperties } from '@chainfuse/types';
import type { UuidExport } from '@chainfuse/types/d1';
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { timingSafeEqual } from 'node:crypto';
import { describe, it } from 'node:test';
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
				const { z } = await import('zod/v4');
				const result = z.uuid({ version: 'v7' }).safeParse(uuid.utf8);
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
				const { z } = await import('zod/v4');
				const result = z.uuid({ version: 'v7' }).safeParse(uuid.utf8);
				ok(result.success, `Expected valid UUID v7, got: ${uuid.utf8}`);

				// Extract timestamp from UUID v7 (first 48 bits)
				const timestampHex = uuid.hex.substring(0, 12);
				const timestamp = Number(BigInt(`0x${timestampHex}`));

				// Timestamp should match the custom date
				strictEqual(timestamp, customDate.getTime(), 'UUID should contain the custom timestamp');
			});
		});

		void describe('UUID v8 Generation', () => {
			void it('generates a valid UUID v8 with default options', async () => {
				const uuid = await BufferHelpers.generateUuid8();

				// Check all required fields are present
				ok(uuid.utf8, 'Should have utf8 field');
				ok(uuid.hex, 'Should have hex field');
				ok(uuid.blob, 'Should have blob field');
				ok(uuid.base64, 'Should have base64 field');
				ok(uuid.base64url, 'Should have base64url field');

				// Validate UUID v8 format using Zod
				const { z } = await import('zod/v4');
				const result = z.uuid({ version: 'v8' }).safeParse(uuid.utf8);
				ok(result.success, `Expected valid UUID v8, got: ${uuid.utf8}`);

				// Check hex is 32 characters (no hyphens)
				strictEqual(uuid.hex.length, 32);
				ok(/^[0-9a-f]{32}$/i.test(uuid.hex), 'Hex should contain only hex characters');

				// Check blob is 16 bytes
				ok(uuid.blob instanceof ArrayBuffer, 'Blob should be ArrayBuffer');
				strictEqual(uuid.blob.byteLength, 16);

				// Check default values are injected correctly
				// Default suffix should be '000' at positions 13-16 in hex (corresponds to 16-19 in UUID string)
				strictEqual(uuid.hex.substring(13, 16), '000', 'Default suffix should be 000');
				// Note: Default location '00' is part of the default suffix '000' pattern
			});

			void it('generates UUID v8 with custom location', async () => {
				const { DOCombinedLocations } = await import('@chainfuse/types');
				const uuid = await BufferHelpers.generateUuid8({
					location: DOCombinedLocations.wnam,
				});

				// Validate UUID v8 format
				const { z } = await import('zod/v4');
				const result = z.uuid({ version: 'v8' }).safeParse(uuid.utf8);
				ok(result.success, `Expected valid UUID v8, got: ${uuid.utf8}`);

				// Check custom location is injected (wnam = 10 = 0x0a)
				// From debug: pattern "a0a1" at positions 16-19, where 'a' is at 16, '0' at 17, 'a' at 18, '1' at 19
				// It seems the location byte 'a' is at position 16
				strictEqual(uuid.hex.substring(18, 19), 'a', 'Custom location should be injected');
			});

			void it('generates UUID v8 with custom shard type', async () => {
				const { ShardType } = await import('@chainfuse/types/d0');
				const uuid = await BufferHelpers.generateUuid8({
					shardType: ShardType.Storage,
				});

				// Validate UUID v8 format
				const { z } = await import('zod/v4');
				const result = z.uuid({ version: 'v8' }).safeParse(uuid.utf8);
				ok(result.success, `Expected valid UUID v8, got: ${uuid.utf8}`);

				// Check custom shard type is injected (Storage = 1)
				// From debug: pattern "a0a1" shows '1' at position 19
				strictEqual(uuid.hex.substring(19, 20), '1', 'Custom shard type should be injected');
			});

			void it('generates UUID v8 with custom suffix', async () => {
				const uuid = await BufferHelpers.generateUuid8({
					suffix: 'abc',
				});

				// Validate UUID v8 format
				const { z } = await import('zod/v4');
				const result = z.uuid({ version: 'v8' }).safeParse(uuid.utf8);
				ok(result.success, `Expected valid UUID v8, got: ${uuid.utf8}`);

				// Check custom suffix is injected
				// From debug: "abc" found at position 13-16
				strictEqual(uuid.hex.substring(13, 16), 'abc', 'Custom suffix should be injected');
			});

			void it('generates UUID v8 with custom timestamp', async () => {
				const customTime = new Date('2023-01-01T00:00:00.000Z');
				const uuid = await BufferHelpers.generateUuid8({
					msecs: customTime,
				});

				// Validate UUID v8 format
				const { z } = await import('zod/v4');
				const result = z.uuid({ version: 'v8' }).safeParse(uuid.utf8);
				ok(result.success, `Expected valid UUID v8, got: ${uuid.utf8}`);

				// Extract timestamp from UUID (first 48 bits)
				const timestampHex = uuid.hex.substring(0, 12);
				const timestamp = Number(BigInt(`0x${timestampHex}`));

				// Should match the custom timestamp
				strictEqual(timestamp, customTime.getTime(), 'Custom timestamp should be injected');
			});

			void it('generates UUID v8 with all custom fields', async () => {
				const { DOCombinedLocations } = await import('@chainfuse/types');
				const { ShardType } = await import('@chainfuse/types/d0');

				const customTime = new Date('2023-06-15T12:00:00.000Z');
				const uuid = await BufferHelpers.generateUuid8({
					msecs: customTime,
					location: DOCombinedLocations.enam,
					shardType: ShardType.Storage,
					suffix: 'def',
				});

				// Validate UUID v8 format
				const { z } = await import('zod/v4');
				const result = z.uuid({ version: 'v8' }).safeParse(uuid.utf8);
				ok(result.success, `Expected valid UUID v8, got: ${uuid.utf8}`);

				// Check all custom fields are injected
				strictEqual(uuid.hex.substring(13, 16), 'def', 'Custom suffix should be injected');
				strictEqual(uuid.hex.substring(18, 19), 'b', 'Custom location should be injected (enam = 11 = 0x0b)');
				strictEqual(uuid.hex.substring(19, 20), '1', 'Custom shard type should be injected (Storage = 1)');

				// Check custom timestamp
				const timestampHex = uuid.hex.substring(0, 12);
				const timestamp = Number(BigInt(`0x${timestampHex}`));
				strictEqual(timestamp, customTime.getTime(), 'Custom timestamp should be injected');
			});

			void it('generates different UUIDs on multiple calls', async () => {
				const uuid1 = await BufferHelpers.generateUuid8();
				const uuid2 = await BufferHelpers.generateUuid8();

				ok(uuid1.utf8 !== uuid2.utf8, 'UUIDs should be different');
				ok(uuid1.hex !== uuid2.hex, 'Hex values should be different');
			});

			void it('generates consistent UUID with same inputs', async () => {
				const { DOCombinedLocations } = await import('@chainfuse/types');
				const { ShardType } = await import('@chainfuse/types/d0');

				const options = {
					msecs: new Date('2023-01-01T00:00:00.000Z'),
					location: DOCombinedLocations.weur,
					shardType: ShardType.Director,
					suffix: 'abc',
				};

				const uuid1 = await BufferHelpers.generateUuid8(options);
				const uuid2 = await BufferHelpers.generateUuid8(options);

				// Should be identical with same inputs (assuming same random bytes, which they won't be)
				// But at least the deterministic parts should be the same
				strictEqual(uuid1.hex.substring(0, 12), uuid2.hex.substring(0, 12), 'Timestamp portion should be identical');
				strictEqual(uuid1.hex.substring(13, 16), uuid2.hex.substring(13, 16), 'Suffix should be identical');
				strictEqual(uuid1.hex.substring(18, 19), uuid2.hex.substring(18, 19), 'Location should be identical');
				strictEqual(uuid1.hex.substring(19, 20), uuid2.hex.substring(19, 20), 'Shard type should be identical');
			});

			void it('handles Uint8Array suffix input', async () => {
				const suffixBytes = new Uint8Array([0xab, 0xcd]);
				const uuid = await BufferHelpers.generateUuid8({
					suffix: suffixBytes,
				});

				// Validate UUID v8 format
				const { z } = await import('zod/v4');
				const result = z.uuid({ version: 'v8' }).safeParse(uuid.utf8);
				ok(result.success, `Expected valid UUID v8, got: ${uuid.utf8}`);

				// Check that the suffix was processed correctly
				// The implementation should convert Uint8Array to hex and truncate to 3 chars
				const expectedSuffix = 'bcd'; // Last 3 chars of 'abcd'
				strictEqual(uuid.hex.substring(13, 16), expectedSuffix, 'Uint8Array suffix should be converted correctly');
			});
		});

		void describe('UUID Format Consistency', () => {
			void it('maintains consistent format between v7 and v8 generation', async () => {
				const uuidV7 = await BufferHelpers.generateUuid7();
				const uuidV8 = await BufferHelpers.generateUuid8();

				// Both should have the same structure
				const v7Keys = Object.keys(uuidV7).sort();
				const v8Keys = Object.keys(uuidV8).sort();
				deepStrictEqual(v7Keys, v8Keys, 'Both UUID types should have the same fields');

				// Both should have same field types
				strictEqual(typeof uuidV7.utf8, typeof uuidV8.utf8, 'utf8 types should match');
				strictEqual(typeof uuidV7.hex, typeof uuidV8.hex, 'hex types should match');
				strictEqual(typeof uuidV7.base64, typeof uuidV8.base64, 'base64 types should match');
				strictEqual(typeof uuidV7.base64url, typeof uuidV8.base64url, 'base64url types should match');
				ok(uuidV7.blob instanceof ArrayBuffer && uuidV8.blob instanceof ArrayBuffer, 'blob should be ArrayBuffer for both');

				// Both should have 32-char hex strings
				strictEqual(uuidV7.hex.length, 32);
				strictEqual(uuidV8.hex.length, 32);

				// Both should have 16-byte blobs
				strictEqual(uuidV7.blob.byteLength, 16);
				strictEqual(uuidV8.blob.byteLength, 16);
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

		void describe('UUID v8 Extraction', () => {
			void it('extracts all fields from UUID v8 with default options', async () => {
				const uuid = await BufferHelpers.generateUuid8({});

				const extracted = await BufferHelpers.uuidExtractor(uuid.utf8);

				// Should have all v8 properties
				ok('date' in extracted, 'Should have date property');
				ok('location' in extracted, 'Should have location property');
				ok('shardType' in extracted, 'Should have shardType property');
				ok('suffix' in extracted, 'Should have suffix property');

				// Check types
				ok(extracted.date instanceof Date, 'Date should be a Date object');
				strictEqual(typeof extracted.location, 'number', 'Location should be a number');
				strictEqual(typeof extracted.shardType, 'number', 'ShardType should be a number');

				// Default suffix should be undefined (since it's '000')
				strictEqual(extracted.suffix, undefined, 'Default suffix should be undefined');
				// Default location should be 0
				strictEqual(extracted.location, 0, 'Default location should be 0');
				// Default shardType should be 0
				strictEqual(extracted.shardType, 0, 'Default shardType should be 0');
			});

			void it('extracts custom timestamp from UUID v8', async () => {
				const customDate = new Date('2023-06-15T12:30:45.123Z');
				const uuid = await BufferHelpers.generateUuid8({
					msecs: customDate,
				});

				const extracted = await BufferHelpers.uuidExtractor(uuid.utf8);

				ok(extracted.date instanceof Date, 'Should extract a Date object');
				strictEqual(extracted.date.getTime(), customDate.getTime(), 'Should extract the correct custom timestamp');
			});

			void it('extracts custom location from UUID v8', async () => {
				const { DOCombinedLocations } = await import('@chainfuse/types');
				const uuid = await BufferHelpers.generateUuid8({
					location: DOCombinedLocations.wnam,
				});

				const extracted = await BufferHelpers.uuidExtractor(uuid.utf8);

				// Type guard for UUID v8
				if ('location' in extracted) {
					strictEqual(extracted.location, DOCombinedLocations.wnam, 'Should extract the correct location');
				} else {
					ok(false, 'Should extract UUID v8 with location property');
				}
			});

			void it('extracts custom shard type from UUID v8', async () => {
				const { ShardType } = await import('@chainfuse/types/d0');
				const uuid = await BufferHelpers.generateUuid8({
					shardType: ShardType.Storage,
				});

				const extracted = await BufferHelpers.uuidExtractor(uuid.utf8);

				// Type guard for UUID v8
				if ('shardType' in extracted) {
					strictEqual(extracted.shardType, ShardType.Storage, 'Should extract the correct shard type');
				} else {
					ok(false, 'Should extract UUID v8 with shardType property');
				}
			});

			void it('extracts custom suffix from UUID v8', async () => {
				const uuid = await BufferHelpers.generateUuid8({
					suffix: 'abc',
				});

				const extracted = await BufferHelpers.uuidExtractor(uuid.utf8);

				// Type guard for UUID v8
				if ('suffix' in extracted) {
					// Should have suffix object with all formats
					ok(extracted.suffix, 'Should have suffix object');
					ok(typeof extracted.suffix === 'object', 'Suffix should be an object');
					strictEqual(extracted.suffix.hex, 'abc', 'Should extract the correct hex suffix');
					ok(typeof extracted.suffix.base64 === 'string', 'Should have base64 suffix');
					ok(typeof extracted.suffix.base64url === 'string', 'Should have base64url suffix');
				} else {
					ok(false, 'Should extract UUID v8 with suffix property');
				}
			});

			void it('extracts all custom fields from UUID v8', async () => {
				const { DOCombinedLocations } = await import('@chainfuse/types');
				const { ShardType } = await import('@chainfuse/types/d0');

				const customDate = new Date('2023-06-15T12:00:00.000Z');
				const uuid = await BufferHelpers.generateUuid8({
					msecs: customDate,
					location: DOCombinedLocations.enam,
					shardType: ShardType.Storage,
					suffix: 'def',
				});

				const extracted = await BufferHelpers.uuidExtractor(uuid.utf8);

				// Check date (available in both v7 and v8)
				strictEqual(extracted.date.getTime(), customDate.getTime(), 'Should extract correct timestamp');

				// Type guard for UUID v8 specific properties
				if ('location' in extracted && 'shardType' in extracted && 'suffix' in extracted) {
					strictEqual(extracted.location, DOCombinedLocations.enam, 'Should extract correct location');
					strictEqual(extracted.shardType, ShardType.Storage, 'Should extract correct shard type');
					ok(extracted.suffix, 'Should have suffix object');
					strictEqual(extracted.suffix.hex, 'def', 'Should extract correct suffix');
				} else {
					ok(false, 'Should extract UUID v8 with all v8-specific properties');
				}
			});

			void it('extracts from UUID v8 hex format', async () => {
				const { DOCombinedLocations } = await import('@chainfuse/types');
				const uuid = await BufferHelpers.generateUuid8({
					location: DOCombinedLocations.weur,
					suffix: '123',
				});

				const extracted = await BufferHelpers.uuidExtractor(uuid.hex);

				// Type guard for UUID v8
				if ('location' in extracted && 'suffix' in extracted) {
					strictEqual(extracted.location, DOCombinedLocations.weur, 'Should extract correct location from hex');
					ok(extracted.suffix, 'Should have suffix object');
					strictEqual(extracted.suffix.hex, '123', 'Should extract correct suffix from hex');
				} else {
					ok(false, 'Should extract UUID v8 properties from hex format');
				}
			});

			void it('extracts from UUID v8 blob format', async () => {
				const { ShardType } = await import('@chainfuse/types/d0');
				const uuid = await BufferHelpers.generateUuid8({
					shardType: ShardType.Storage,
					suffix: '456',
				});

				const extracted = await BufferHelpers.uuidExtractor(uuid.blob);

				// Type guard for UUID v8
				if ('shardType' in extracted && 'suffix' in extracted) {
					strictEqual(extracted.shardType, ShardType.Storage, 'Should extract correct shard type from blob');
					ok(extracted.suffix, 'Should have suffix object');
					strictEqual(extracted.suffix.hex, '456', 'Should extract correct suffix from blob');
				} else {
					ok(false, 'Should extract UUID v8 properties from blob format');
				}
			});

			void it('handles Uint8Array suffix correctly', async () => {
				const suffixBytes = new Uint8Array([0xab, 0xcd]); // Must be exactly 2 bytes
				const uuid = await BufferHelpers.generateUuid8({
					suffix: suffixBytes,
				});

				const extracted = await BufferHelpers.uuidExtractor(uuid.utf8);

				// Type guard for UUID v8
				if ('suffix' in extracted) {
					ok(extracted.suffix, 'Should have suffix object');
					// The implementation should take 'abcd' and pad/slice to 3 chars -> 'bcd'
					strictEqual(extracted.suffix.hex, 'bcd', 'Should extract correct suffix from Uint8Array');
				} else {
					ok(false, 'Should extract UUID v8 with suffix property');
				}
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

			void it('works with base64url UUID input', async () => {
				const { DOCombinedLocations } = await import('@chainfuse/types');
				const uuid = await BufferHelpers.generateUuid8({
					location: DOCombinedLocations.enam,
					suffix: '123', // Use valid hex instead of 'xyz'
				});

				const extracted = await BufferHelpers.uuidExtractor(uuid.base64url);

				// Type guard for UUID v8
				if ('location' in extracted && 'suffix' in extracted) {
					strictEqual(extracted.location, DOCombinedLocations.enam, 'Should extract correct location from base64url');
					ok(extracted.suffix, 'Should have suffix object');
					strictEqual(extracted.suffix.hex, '123', 'Should extract correct suffix from base64url');
				} else {
					ok(false, 'Should extract UUID v8 properties from base64url format');
				}
			});
		});
	});
});
