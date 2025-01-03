import { doesNotReject, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CryptoHelpers } from '../dist/crypto.mjs';

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
});
