import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NetHelpers } from '../dist/net.mjs';

void describe('Logging fetch', () => {
	void it(`Fetch JSON`, async () => {
		const response = await NetHelpers.loggingFetch(new URL('cf.json', 'https://workers.cloudflare.com'), {
			logging: { level: 3 },
		});
		ok(response.ok);

		const json = await response.json();
		strictEqual(typeof json, 'object');
	});
});
