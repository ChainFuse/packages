import { DOCombinedLocations } from '@chainfuse/types';
import { ShardType } from '@chainfuse/types/d0';
import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod/v4';
import { v8, type Version8Options } from '../dist/uuid8.mjs';

// Helper function to validate UUID v8 format using Zod
const validateUuidV8 = (uuid: string) => {
	const result = z.uuid({ version: 'v8' }).safeParse(uuid);
	ok(result.success, `Expected valid UUID v8, got: ${uuid}`);
};

void describe('UUID v8 Generator Tests', () => {
	void describe('Basic UUID v8 Generation', () => {
		void it('generates a valid UUID v8 with default options', () => {
			const uuid = v8();

			// Check format using Zod's UUID v8 validation
			validateUuidV8(uuid);

			// Check that it's version 8
			strictEqual(uuid.charAt(14), '8');
		});

		void it('generates different UUIDs on multiple calls', () => {
			const uuid1 = v8();
			const uuid2 = v8();

			ok(uuid1 !== uuid2, 'UUIDs should be different');
		});

		void it('generates UUID with same timestamp when msecs provided', () => {
			const timestamp = Date.now();
			const uuid1 = v8({ msecs: timestamp });
			const uuid2 = v8({ msecs: timestamp });

			// Both should have version 8
			strictEqual(uuid1.charAt(14), '8');
			strictEqual(uuid2.charAt(14), '8');

			// The first 8 characters should be the same (timestamp portion)
			strictEqual(uuid1.substring(0, 8), uuid2.substring(0, 8));
		});

		void it('accepts Date object for msecs', () => {
			const date = new Date();
			const uuid = v8({ msecs: date });

			validateUuidV8(uuid);
		});
	});

	void describe('Custom Fields Injection', () => {
		void it('injects custom location from enum', () => {
			const uuid = v8({ location: DOCombinedLocations.wnam });

			// Location should be injected at positions 20-22 (hex 0a for wnam = 10)
			strictEqual(uuid.substring(20, 22), '0a');
		});

		void it('injects custom location from hex string', () => {
			const uuid = v8({ location: 'ff' });

			// Location should be injected at positions 20-22
			strictEqual(uuid.substring(20, 22), 'ff');
		});

		void it('injects custom shard type from enum', () => {
			const uuid = v8({ shardType: ShardType.Storage });

			// Shard type should be injected at position 22 (hex 1 for Storage)
			strictEqual(uuid.substring(22, 23), '1');
		});

		void it('injects custom shard type from hex string', () => {
			const uuid = v8({ shardType: 'f' });

			// Shard type should be injected at position 22
			strictEqual(uuid.substring(22, 23), 'f');
		});

		void it('injects custom suffix from hex string', () => {
			const uuid = v8({ suffix: 'abc' });

			// Suffix should be injected at positions 15-18
			strictEqual(uuid.substring(15, 18), 'abc');
		});

		void it('injects custom suffix from Uint8Array', () => {
			const suffixBytes = new Uint8Array([0xab, 0xcd]);
			const uuid = v8({ suffix: suffixBytes });

			// Should inject the hex representation of the bytes (truncated to 3 chars)
			strictEqual(uuid.substring(15, 18), 'bcd');
		});

		void it('combines all custom fields', () => {
			const options: Version8Options = {
				location: DOCombinedLocations.enam,
				shardType: ShardType.Storage,
				suffix: 'abc',
			};

			const uuid = v8(options);

			// Check all injected fields
			strictEqual(uuid.substring(15, 18), 'abc'); // suffix
			strictEqual(uuid.substring(20, 22), '0b'); // enam = 11 = 0x0b
			strictEqual(uuid.substring(22, 23), '1'); // Storage = 1
		});
	});

	void describe('Sequence Number Handling', () => {
		void it('accepts sequence number', () => {
			const seq = 0x12345678;
			const uuid = v8({ seq });

			// Should generate valid UUID
			validateUuidV8(uuid);
		});

		void it('handles maximum sequence number', () => {
			const uuid = v8({ seq: 0xffffffff });

			validateUuidV8(uuid);
		});

		void it('handles zero sequence number', () => {
			const uuid = v8({ seq: 0 });

			validateUuidV8(uuid);
		});
	});

	void describe('Random Number Generation', () => {
		void it('accepts custom random bytes', () => {
			const randomBytes = new Uint8Array(16);
			randomBytes.fill(0xaa); // Fill with predictable pattern

			const uuid = v8({ random: randomBytes });

			validateUuidV8(uuid);
		});

		void it('accepts custom RNG function', () => {
			const customRng = () => {
				const bytes = new Uint8Array(16);
				bytes.fill(0xbb); // Predictable pattern
				return bytes;
			};

			const uuid = v8({ rng: customRng });

			validateUuidV8(uuid);
		});
	});

	void describe('Default Values', () => {
		void it('uses default location when not specified', () => {
			const uuid = v8();

			// Default location should be '00'
			strictEqual(uuid.substring(20, 22), '00');
		});

		void it('uses default shard type when not specified', () => {
			const uuid = v8();

			// Default shard type should be '0' (Director)
			strictEqual(uuid.substring(22, 23), '0');
		});

		void it('uses default suffix when not specified', () => {
			const uuid = v8();

			// Default suffix should be '000'
			strictEqual(uuid.substring(15, 18), '000');
		});
	});

	void describe('Input Validation', () => {
		void it('validates location hex string length', () => {
			// Should not throw for valid 2-char hex
			v8({ location: 'ab' });

			// Test with default when invalid length would be provided
			// Note: Zod schema should handle validation
		});

		void it('validates shard type hex string length', () => {
			// Should not throw for valid 1-char hex
			v8({ shardType: 'a' });
		});

		void it('validates suffix hex string length', () => {
			// Should not throw for valid 3-char hex
			v8({ suffix: 'abc' });
		});

		void it('validates suffix Uint8Array length', () => {
			// Should not throw for valid 2-byte array
			v8({ suffix: new Uint8Array(2) });
		});

		void it('validates random bytes array length', () => {
			// Should not throw for valid 16-byte array
			v8({ random: new Uint8Array(16) });
		});

		void it('validates sequence number range', () => {
			// Should not throw for valid range
			v8({ seq: 0 });
			v8({ seq: 0xffffffff });
		});
	});

	void describe('Edge Cases', () => {
		void it('handles empty options object', () => {
			const uuid = v8({});

			validateUuidV8(uuid);
		});

		void it('handles undefined options', () => {
			const uuid = v8(undefined);

			validateUuidV8(uuid);
		});

		void it('generates consistent UUIDs with same inputs', () => {
			const options: Version8Options = {
				msecs: 1693651200000, // Fixed timestamp
				seq: 12345,
				location: DOCombinedLocations.weur,
				shardType: ShardType.Director,
				suffix: 'abc',
				random: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
			};

			const uuid1 = v8(options);
			const uuid2 = v8(options);

			// Should be identical with same inputs
			strictEqual(uuid1, uuid2);
		});

		void it('maintains UUID v8 format with all custom fields', () => {
			const uuid = v8({
				location: DOCombinedLocations.apac,
				shardType: ShardType.Storage,
				suffix: 'def',
			});

			// Verify structure: 8 chars, hyphen, 4 chars, hyphen, version + 3 chars, hyphen, 4 chars, hyphen, 12 chars
			strictEqual(uuid.length, 36);
			strictEqual(uuid.charAt(8), '-');
			strictEqual(uuid.charAt(13), '-');
			strictEqual(uuid.charAt(14), '8'); // Version 8
			strictEqual(uuid.charAt(18), '-');
			strictEqual(uuid.charAt(23), '-');

			// Verify injected fields
			strictEqual(uuid.substring(15, 18), 'def'); // suffix
			strictEqual(uuid.substring(20, 22), '0f'); // apac = 15 = 0x0f
			strictEqual(uuid.substring(22, 23), '1'); // Storage = 1
		});
	});

	void describe('Location Enum Mappings', () => {
		const locationTests = [
			{ enum: DOCombinedLocations.none, expected: '00' },
			{ enum: DOCombinedLocations.eu, expected: '01' },
			{ enum: DOCombinedLocations.fedramp, expected: '02' },
			{ enum: DOCombinedLocations.wnam, expected: '0a' },
			{ enum: DOCombinedLocations.enam, expected: '0b' },
			{ enum: DOCombinedLocations.sam, expected: '0c' },
			{ enum: DOCombinedLocations.weur, expected: '0d' },
			{ enum: DOCombinedLocations.eeur, expected: '0e' },
			{ enum: DOCombinedLocations.apac, expected: '0f' },
			{ enum: DOCombinedLocations.oc, expected: '10' },
			{ enum: DOCombinedLocations.afr, expected: '11' },
			{ enum: DOCombinedLocations.me, expected: '12' },
		];

		for (const { enum: location, expected } of locationTests) {
			void it(`maps ${DOCombinedLocations[location]} to ${expected}`, () => {
				const uuid = v8({ location });
				strictEqual(uuid.substring(20, 22), expected);
			});
		}
	});

	void describe('Shard Type Enum Mappings', () => {
		void it('maps Director to 0', () => {
			const uuid = v8({ shardType: ShardType.Director });
			strictEqual(uuid.substring(22, 23), '0');
		});

		void it('maps Storage to 1', () => {
			const uuid = v8({ shardType: ShardType.Storage });
			strictEqual(uuid.substring(22, 23), '1');
		});
	});
});
