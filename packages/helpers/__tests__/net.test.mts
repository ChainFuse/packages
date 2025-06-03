import { ok, rejects, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NetHelpers } from '../dist/net.mjs';

void describe('Logging fetch', () => {
	void it(`Fetch JSON`, async () => {
		const response = await NetHelpers.loggingFetch(new URL('cf.json', 'https://workers.cloudflare.com'), {
			logging: { level: 3 },
		});
		ok(response.ok);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const json = await response.json();
		strictEqual(typeof json, 'object');
	});
});

void describe('CF fetch', () => {
	void it(`Fetch JSON`, async () => {
		const response = (await NetHelpers.cfApi('apikey', { level: 3 })).accounts.list({ per_page: 50 }, { maxRetries: 0 });

		await rejects(response);
	});
});

void describe('withRetry', () => {
	void it('should work with functions that have no arguments', async () => {
		let attempts = 0;
		// eslint-disable-next-line @typescript-eslint/require-await
		const operation = async () => {
			attempts++;
			if (attempts < 3) {
				throw new Error('Temporary failure');
			}
			return 'success';
		};

		const result = await NetHelpers.withRetry(operation, { maxRetries: 3, initialDelay: 10 });
		strictEqual(result, 'success');
		strictEqual(attempts, 3);
	});

	void it('should work with functions that have arguments', async () => {
		let attempts = 0;
		// eslint-disable-next-line @typescript-eslint/require-await
		const operation = async (value: string, multiplier: number) => {
			attempts++;
			if (attempts < 2) {
				throw new Error('Temporary failure');
			}
			return value.repeat(multiplier);
		};

		const result = await NetHelpers.withRetry(() => operation('hello', 3), { maxRetries: 3, initialDelay: 10 });
		strictEqual(result, 'hellohellohello');
		strictEqual(attempts, 2);
	});

	void it('should respect maxRetries and eventually throw', async () => {
		let attempts = 0;
		// eslint-disable-next-line @typescript-eslint/require-await
		const operation = async (shouldFail: boolean) => {
			attempts++;
			if (shouldFail) {
				throw new Error('Always fails');
			}
			return 'success';
		};

		await rejects(
			NetHelpers.withRetry(() => operation(true), { maxRetries: 2, initialDelay: 10 }),
			/Always fails/,
		);
		strictEqual(attempts, 3); // Initial attempt + 2 retries
	});

	void it('should work with default config for no-argument functions', async () => {
		let attempts = 0;
		// eslint-disable-next-line @typescript-eslint/require-await
		const operation = async () => {
			attempts++;
			if (attempts === 1) {
				throw new Error('First attempt fails');
			}
			return 'success on retry';
		};

		const result = await NetHelpers.withRetry(operation);
		strictEqual(result, 'success on retry');
		strictEqual(attempts, 2);
	});

	void it('should work with default config for functions with arguments', async () => {
		let attempts = 0;
		// eslint-disable-next-line @typescript-eslint/require-await
		const operation = async (prefix: string) => {
			attempts++;
			if (attempts === 1) {
				throw new Error('First attempt fails');
			}
			return `${prefix} success`;
		};

		const result = await NetHelpers.withRetry(() => operation('test'));
		strictEqual(result, 'test success');
		strictEqual(attempts, 2);
	});
});
