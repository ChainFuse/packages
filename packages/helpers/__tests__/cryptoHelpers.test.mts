import { doesNotReject, strictEqual } from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
		const hashAlgorithms: { name: Parameters<typeof CryptoHelpers.getHash>[0]; node: Parameters<typeof createHash>[0]; length: number }[] = [
			{ name: 'SHA-1', node: 'sha1', length: (160 / 8) * 2 },
			{ name: 'SHA-256', node: 'sha256', length: (256 / 8) * 2 },
			{ name: 'SHA-384', node: 'sha384', length: (384 / 8) * 2 },
			{ name: 'SHA-512', node: 'sha512', length: (512 / 8) * 2 },
		];

		hashAlgorithms.forEach(({ name, node, length }) => {
			void it(`Node native tests for ${name}`, async () => {
				const testData = 'Hello, World!';
				const expectedHash = createHash(node).update(testData).digest('hex');
				const actualHash = await CryptoHelpersInternals.node_getHash(name, testData);
				strictEqual(typeof actualHash, 'string');
				strictEqual(actualHash.length, length);
				strictEqual(actualHash.toLowerCase(), expectedHash.toLowerCase());
			});

			void it(`Browser tests for ${name}`, async () => {
				const testData = 'Hello, World!';
				const expectedHash = createHash(node).update(testData).digest('hex');
				const actualHash = await CryptoHelpersInternals.browser_getHash(name, testData);
				strictEqual(typeof actualHash, 'string');
				strictEqual(actualHash.length, length);
				strictEqual(actualHash.toLowerCase(), expectedHash.toLowerCase());
			});
		});
	});
});
