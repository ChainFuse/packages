import { doesNotReject, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CryptoHelpers } from '../dist/crypto.mjs';
import { CryptoHelpersInternals } from '../dist/cryptoInternals.mjs';

void describe('Crypto Helper Tests', () => {
	void describe('Secrets', () => {
		for (const bitStrength of [512, 384, 256, 128]) {
			void it(`Running secrets of ${bitStrength}bits`, async () => {
				// Each hex character represents 4 bits (but in utf8 format)
				await doesNotReject(CryptoHelpers.base16secret(bitStrength / 8).then((secret) => strictEqual(secret.length, bitStrength / 8)));
				// Each utf8 character represents 8 bits
				await doesNotReject(CryptoHelpers.base62secret(bitStrength / 8).then((secret) => strictEqual(secret.length, bitStrength / 8)));
			});
		}
	});

	void describe('Secret Bytes', () => {
		void it('Node native tests', async () => {
			await doesNotReject(CryptoHelpersInternals.node_secretBytes(32).then((bytes) => strictEqual(bytes.length, 32)));
		});

		void it('Browser tests', () => {
			const bytes = CryptoHelpersInternals.browser_secretBytes(32);
			strictEqual(bytes.length, 32);
		});
	});

	void describe('Hashing', () => {
		void it('Node native tests', async () => {
			const testData = 'Hello, World!';
			await doesNotReject(CryptoHelpersInternals.node_getHash('SHA-256', testData).then((hash) => strictEqual(typeof hash, 'string')));
		});

		void it('Browser tests', async () => {
			const testData = 'Hello, World!';
			await doesNotReject(CryptoHelpersInternals.browser_getHash('SHA-256', testData).then((hash) => strictEqual(typeof hash, 'string')));
		});
	});
});
