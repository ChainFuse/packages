import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SuruId } from '../src/suru.mjs';
import { D0Version, D0SystemType, D0ShardType, D0Environment } from '@chainfuse/types/d0';
import { DOJurisdictions, DOLocations } from '@chainfuse/types';

void describe('SuruId', () => {
	void describe('Create and Extract Round Trip Tests', () => {
		void it('should create and extract with jurisdiction (async)', async () => {
			const testDate = new Date('2023-01-01T00:00:00.000Z');

			const input = {
				version: D0Version.v1,
				date: testDate,
				systemType: D0SystemType.User,
				shardType: D0ShardType.Storage,
				locationJurisdiction: DOJurisdictions['The European Union'],
				locationHint: null,
				environment: D0Environment.Production,
			};

			// Create SuruId
			const created = await SuruId.suruCreate(input);
			ok(created);
			ok(created.hex);
			strictEqual(created.hex.length, 96);

			// Extract from created SuruId
			const extracted = await SuruId.suruExtract(created.hex);

			// Verify all fields match
			strictEqual(extracted.version, input.version);
			strictEqual(extracted.date.getTime(), testDate.getTime());
			strictEqual(extracted.systemType, input.systemType);
			strictEqual(extracted.shardType, input.shardType);
			strictEqual(extracted.locationJurisdiction, input.locationJurisdiction);
			strictEqual(extracted.locationHint, input.locationHint);
			strictEqual(extracted.environment, input.environment);

			// Random fields should have correct format
			ok(extracted.suffixRandom.hex);
			strictEqual(extracted.suffixRandom.hex.length, 10);
			ok(extracted.stableRandom.hex);
			strictEqual(extracted.stableRandom.hex.length, 64);
		});

		void it('should create and extract with location hint (async)', async () => {
			const testDate = new Date('2023-06-15T12:30:45.123Z');

			const input = {
				version: D0Version.v1,
				date: testDate,
				systemType: D0SystemType.Dataspace,
				shardType: D0ShardType.None,
				locationJurisdiction: null,
				locationHint: DOLocations['Western North America'],
				environment: D0Environment.Preview,
			};

			// Create SuruId
			const created = await SuruId.suruCreate(input);
			ok(created);
			ok(created.hex);
			strictEqual(created.hex.length, 96);

			// Extract from created SuruId
			const extracted = await SuruId.suruExtract(created.hex);

			// Verify all fields match
			strictEqual(extracted.version, input.version);
			strictEqual(extracted.date.getTime(), testDate.getTime());
			strictEqual(extracted.systemType, input.systemType);
			strictEqual(extracted.shardType, input.shardType);
			strictEqual(extracted.locationJurisdiction, input.locationJurisdiction);
			strictEqual(extracted.locationHint, input.locationHint);
			strictEqual(extracted.environment, input.environment);
		});

		void it('should create and extract with no location (async)', async () => {
			const testDate = new Date('2024-12-31T23:59:59.999Z');

			const input = {
				version: D0Version.v1,
				date: testDate,
				systemType: D0SystemType.Workflow,
				shardType: D0ShardType.Storage,
				locationJurisdiction: null,
				locationHint: null,
				environment: D0Environment.Production,
			};

			// Create SuruId
			const created = await SuruId.suruCreate(input);
			ok(created);
			ok(created.hex);
			strictEqual(created.hex.length, 96);

			// Extract from created SuruId
			const extracted = await SuruId.suruExtract(created.hex);

			// Verify all fields match
			strictEqual(extracted.version, input.version);
			strictEqual(extracted.date.getTime(), testDate.getTime());
			strictEqual(extracted.systemType, input.systemType);
			strictEqual(extracted.shardType, input.shardType);
			strictEqual(extracted.locationJurisdiction, input.locationJurisdiction);
			strictEqual(extracted.locationHint, input.locationHint);
			strictEqual(extracted.environment, input.environment);
		});

		void it('should create and extract with defaults (async)', async () => {
			const input = {
				systemType: D0SystemType.Tenant,
				environment: D0Environment.Production,
			};

			// Create SuruId with defaults
			const created = await SuruId.suruCreate(input);
			ok(created);
			ok(created.hex);
			strictEqual(created.hex.length, 96);

			// Extract from created SuruId
			const extracted = await SuruId.suruExtract(created.hex);

			// Verify defaults are applied correctly
			strictEqual(extracted.version, D0Version.v1);
			strictEqual(extracted.systemType, D0SystemType.Tenant);
			strictEqual(extracted.shardType, D0ShardType.None);
			strictEqual(extracted.locationJurisdiction, null);
			strictEqual(extracted.locationHint, null);
			strictEqual(extracted.environment, D0Environment.Production);
			ok(extracted.date instanceof Date);
		});
	});

	void describe('Create and Extract Round Trip Tests (Sync)', () => {
		void it('should create and extract with jurisdiction (sync)', () => {
			const testDate = new Date('2023-01-01T00:00:00.000Z');

			const input = {
				version: D0Version.v1,
				date: testDate,
				systemType: D0SystemType.User,
				shardType: D0ShardType.Storage,
				locationJurisdiction: DOJurisdictions['FedRAMP-compliant data centers'],
				locationHint: null,
				environment: D0Environment.Preview,
			};

			// Create SuruId
			const created = SuruId.suruCreateSync(input);
			ok(created);
			ok(created.hex);
			strictEqual(created.hex.length, 96);

			// Extract from created SuruId
			const extracted = SuruId.suruExtractSync(created.hex);

			// Verify all fields match
			strictEqual(extracted.version, input.version);
			strictEqual(extracted.date.getTime(), testDate.getTime());
			strictEqual(extracted.systemType, input.systemType);
			strictEqual(extracted.shardType, input.shardType);
			strictEqual(extracted.locationJurisdiction, input.locationJurisdiction);
			strictEqual(extracted.locationHint, input.locationHint);
			strictEqual(extracted.environment, input.environment);
		});

		void it('should create and extract with various location hints (sync)', () => {
			const locations = [DOLocations['Eastern North America'], DOLocations['South America'], DOLocations['Western Europe'], DOLocations['Eastern Europe'], DOLocations['Asia-Pacific'], DOLocations.Oceania, DOLocations.Africa, DOLocations['Middle East']];

			for (const location of locations) {
				const testDate = new Date('2023-03-15T09:30:00.000Z');

				const input = {
					version: D0Version.v1,
					date: testDate,
					systemType: D0SystemType.Dataspace,
					shardType: D0ShardType.None,
					locationJurisdiction: null,
					locationHint: location,
					environment: D0Environment.Production,
				};

				// Create and extract
				const created = SuruId.suruCreateSync(input);
				const extracted = SuruId.suruExtractSync(created.hex);

				// Verify location hint is preserved
				strictEqual(extracted.locationHint, location);
				strictEqual(extracted.locationJurisdiction, null);
			}
		});
	});

	void describe('Conversion Tests', () => {
		void it('should convert between different formats (async)', async () => {
			const input = {
				systemType: D0SystemType.User,
				environment: D0Environment.Preview,
			};

			// Create initial SuruId
			const created = await SuruId.suruCreate(input);

			// Test conversion from hex
			const convertedFromHex = await SuruId.suruConvert(created.hex);
			strictEqual(convertedFromHex.hex, created.hex);
			strictEqual(convertedFromHex.base64, created.base64);
			strictEqual(convertedFromHex.base64url, created.base64url);

			// Test conversion from base64
			const convertedFromBase64 = await SuruId.suruConvert(created.base64);
			strictEqual(convertedFromBase64.hex, created.hex);
			strictEqual(convertedFromBase64.base64, created.base64);
			strictEqual(convertedFromBase64.base64url, created.base64url);

			// Test conversion from base64url
			const convertedFromBase64Url = await SuruId.suruConvert(created.base64url);
			strictEqual(convertedFromBase64Url.hex, created.hex);
			strictEqual(convertedFromBase64Url.base64, created.base64);
			strictEqual(convertedFromBase64Url.base64url, created.base64url);
		});

		void it('should convert between different formats (sync)', () => {
			const input = {
				systemType: D0SystemType.Workflow,
				environment: D0Environment.Production,
			};

			// Create initial SuruId
			const created = SuruId.suruCreateSync(input);

			// Test conversion from hex
			const convertedFromHex = SuruId.suruConvertSync(created.hex);
			strictEqual(convertedFromHex.hex, created.hex);
			strictEqual(convertedFromHex.base64, created.base64);
			strictEqual(convertedFromHex.base64url, created.base64url);

			// Test conversion from base64
			const convertedFromBase64 = SuruId.suruConvertSync(created.base64);
			strictEqual(convertedFromBase64.hex, created.hex);
			strictEqual(convertedFromBase64.base64, created.base64);
			strictEqual(convertedFromBase64.base64url, created.base64url);

			// Test conversion from base64url
			const convertedFromBase64Url = SuruId.suruConvertSync(created.base64url);
			strictEqual(convertedFromBase64Url.hex, created.hex);
			strictEqual(convertedFromBase64Url.base64, created.base64);
			strictEqual(convertedFromBase64Url.base64url, created.base64url);
		});
	});

	void describe('Edge Cases', () => {
		void it('should handle undefined input for convert (async)', async () => {
			const result = await SuruId.suruConvert(undefined);
			strictEqual(result.hex, undefined);
			strictEqual(result.blob, undefined);
			strictEqual(result.base64, undefined);
			strictEqual(result.base64url, undefined);
		});

		void it('should handle undefined input for extract (async)', async () => {
			const result = await SuruId.suruExtract(undefined);
			strictEqual(result.version, undefined);
			strictEqual(result.date, undefined);
			strictEqual(result.systemType, undefined);
			strictEqual(result.shardType, undefined);
			strictEqual(result.locationJurisdiction, undefined);
			strictEqual(result.locationHint, undefined);
			strictEqual(result.suffixRandom, undefined);
			strictEqual(result.environment, undefined);
			strictEqual(result.stableRandom, undefined);
		});

		void it('should handle undefined input for convert (sync)', () => {
			const result = SuruId.suruConvertSync(undefined);
			strictEqual(result.hex, undefined);
			strictEqual(result.blob, undefined);
			strictEqual(result.base64, undefined);
			strictEqual(result.base64url, undefined);
		});

		void it('should handle undefined input for extract (sync)', () => {
			const result = SuruId.suruExtractSync(undefined);
			strictEqual(result.version, undefined);
			strictEqual(result.date, undefined);
			strictEqual(result.systemType, undefined);
			strictEqual(result.shardType, undefined);
			strictEqual(result.locationJurisdiction, undefined);
			strictEqual(result.locationHint, undefined);
			strictEqual(result.suffixRandom, undefined);
			strictEqual(result.environment, undefined);
			strictEqual(result.stableRandom, undefined);
		});

		void it('should preserve exact timestamp precision', async () => {
			const preciseDates = [new Date('2023-01-01T00:00:00.000Z'), new Date('2023-01-01T00:00:00.123Z'), new Date('2023-01-01T00:00:00.999Z')];

			for (const testDate of preciseDates) {
				const input = {
					systemType: D0SystemType.User,
					date: testDate,
					environment: D0Environment.Production,
				};

				const created = await SuruId.suruCreate(input);
				const extracted = await SuruId.suruExtract(created.hex);

				strictEqual(extracted.date.getTime(), testDate.getTime());
			}
		});

		void it('should handle all system types', () => {
			const systemTypes = [D0SystemType.Dataspace, D0SystemType.Tenant, D0SystemType.User, D0SystemType.Workflow];

			for (const systemType of systemTypes) {
				const input = {
					systemType,
					environment: D0Environment.Production,
				};

				const created = SuruId.suruCreateSync(input);
				const extracted = SuruId.suruExtractSync(created.hex);

				strictEqual(extracted.systemType, systemType);
			}
		});

		void it('should handle all shard types', () => {
			const shardTypes = [D0ShardType.None, D0ShardType.Storage];

			for (const shardType of shardTypes) {
				const input = {
					systemType: D0SystemType.User,
					shardType,
					environment: D0Environment.Production,
				};

				const created = SuruId.suruCreateSync(input);
				const extracted = SuruId.suruExtractSync(created.hex);

				strictEqual(extracted.shardType, shardType);
			}
		});

		void it('should handle all environments', () => {
			const environments = [D0Environment.Production, D0Environment.Preview];

			for (const environment of environments) {
				const input = {
					systemType: D0SystemType.User,
					environment,
				};

				const created = SuruId.suruCreateSync(input);
				const extracted = SuruId.suruExtractSync(created.hex);

				strictEqual(extracted.environment, environment);
			}
		});
	});

	void describe('Format Validation', () => {
		void it('should produce correct hex length', async () => {
			const created = await SuruId.suruCreate({
				systemType: D0SystemType.User,
				environment: D0Environment.Production,
			});
			strictEqual(created.hex.length, 96);
		});

		void it('should produce valid base64 format', async () => {
			const created = await SuruId.suruCreate({
				systemType: D0SystemType.User,
				environment: D0Environment.Production,
			});

			// Base64 should be valid (no validation here, just format check)
			ok(/^[A-Za-z0-9+/]+=*$/.test(created.base64));
			strictEqual(created.base64.length, 64);
		});

		void it('should produce valid base64url format', async () => {
			const created = await SuruId.suruCreate({
				systemType: D0SystemType.User,
				environment: D0Environment.Production,
			});

			// Base64url should be valid (no validation here, just format check)
			ok(/^[A-Za-z0-9_-]+$/.test(created.base64url));
		});

		void it('should have consistent blob array format', async () => {
			const created = await SuruId.suruCreate({
				systemType: D0SystemType.User,
				environment: D0Environment.Production,
			});

			ok(Array.isArray(created.blob));
			strictEqual(created.blob.length, 48); // 96 hex chars / 2 = 48 bytes
			ok(created.blob.every((byte) => typeof byte === 'number' && byte >= 0 && byte <= 255));
		});
	});
});
