import { Hono } from 'hono';
import { strict as assert } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { OAuth21Provider, type OAuth21Context, type OAuthStorageCallbacks } from '../src/index.mjs';

// Mock crypto for Node.js environment
if (!globalThis.crypto) {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	globalThis.crypto = require('node:crypto').webcrypto;
}

// Simple in-memory storage for testing
function createTestStorage(): OAuthStorageCallbacks {
	const storage = new Map<string, { value: unknown; expiry?: number }>();

	return {
		async get<T = unknown>(key: string): Promise<T | null> {
			const item = storage.get(key);
			if (!item) {
				return null;
			}

			// Check if expired
			if (item.expiry && Date.now() > item.expiry) {
				storage.delete(key);
				return null;
			}

			return item.value as T;
		},

		async put(key: string, value: unknown, options?: { expirationTtl?: number }): Promise<void> {
			const item: { value: unknown; expiry?: number } = { value };

			if (options?.expirationTtl) {
				item.expiry = Date.now() + options.expirationTtl * 1000;
			}

			storage.set(key, item);
		},

		async delete(key: string): Promise<void> {
			storage.delete(key);
		},

		async list(options: { prefix: string; cursor?: string; limit?: number }): Promise<{
			keys: { name: string }[];
			list_complete: boolean;
			cursor?: string;
		}> {
			const { prefix, cursor, limit = 1000 } = options;
			const keys: { name: string }[] = [];

			// Get all keys that match the prefix
			const allKeys = Array.from(storage.keys()).filter((key) => key.startsWith(prefix));

			// Handle cursor-based pagination
			let startIndex = 0;
			if (cursor) {
				const cursorIndex = allKeys.findIndex((key) => key === cursor);
				if (cursorIndex !== -1) {
					startIndex = cursorIndex + 1;
				}
			}

			// Get the slice of keys for this page
			const pageKeys = allKeys.slice(startIndex, startIndex + limit);

			// Remove expired items and build result
			for (const key of pageKeys) {
				const item = storage.get(key);
				if (item) {
					// Check if expired
					if (item.expiry && Date.now() > item.expiry) {
						storage.delete(key);
						continue;
					}
					keys.push({ name: key });
				}
			}

			const isComplete = startIndex + limit >= allKeys.length;
			const nextCursor = isComplete ? undefined : allKeys[startIndex + limit - 1];

			return {
				keys,
				list_complete: isComplete,
				cursor: nextCursor,
			};
		},
	};
}

await describe('OAuth21Provider', () => {
	let provider: OAuth21Provider;
	let storage: OAuthStorageCallbacks;
	let app: Hono;

	beforeEach(() => {
		storage = createTestStorage();
		provider = new OAuth21Provider({
			authorizeEndpoint: '/oauth/authorize',
			tokenEndpoint: '/oauth/token',
			clientRegistrationEndpoint: '/oauth/register',
			storage,
			scopesSupported: ['read', 'write'],
			accessTokenTTL: 3600,
		});

		app = new Hono();
		app.route('/oauth', provider.app);
	});

	it('should create provider instance', () => {
		assert.ok(provider instanceof OAuth21Provider);
	});

	it('should return OAuth metadata', async () => {
		const req = new Request('http://localhost/oauth/.well-known/oauth-authorization-server');
		const res = await app.request(req);

		assert.strictEqual(res.status, 200);
		const metadata = await res.json();

		assert.strictEqual(metadata.issuer, 'http://localhost');
		assert.strictEqual(metadata.authorization_endpoint, 'http://localhost/oauth/authorize');
		assert.strictEqual(metadata.token_endpoint, 'http://localhost/oauth/token');
		assert.deepStrictEqual(metadata.scopes_supported, ['read', 'write']);
		assert.deepStrictEqual(metadata.response_types_supported, ['code']);
		assert.deepStrictEqual(metadata.grant_types_supported, ['authorization_code', 'refresh_token']);
	});

	it('should handle client registration', async () => {
		const clientData = {
			client_name: 'Test Client',
			redirect_uris: ['https://example.com/callback'],
			grant_types: ['authorization_code', 'refresh_token'],
			response_types: ['code'],
		};

		const req = new Request('http://localhost/oauth/register', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(clientData),
		});

		const res = await app.request(req);
		assert.strictEqual(res.status, 201);

		const client = await res.json();
		assert.ok(client.client_id);
		assert.ok(client.client_secret);
		assert.strictEqual(client.client_name, 'Test Client');
		assert.deepStrictEqual(client.redirect_uris, ['https://example.com/callback']);
	});

	it('should handle OAuth helpers', async () => {
		// Create a test client first
		const clientData = {
			client_name: 'Test Client',
			redirect_uris: ['https://example.com/callback'],
		};

		const registerReq = new Request('http://localhost/oauth/register', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(clientData),
		});

		const registerRes = await app.request(registerReq);
		const client = await registerRes.json();

		// Test with a route that uses OAuth helpers
		app.get('/test-helpers', provider.createHelpersMiddleware(), async (c) => {
			const oauthContext = c as OAuth21Context;
			const helpers = oauthContext.oauth;

			// Test parseAuthRequest
			const authReq = await helpers.parseAuthRequest(new Request(`http://localhost/oauth/authorize?response_type=code&client_id=${client.client_id}&redirect_uri=https://example.com/callback&scope=read&state=test123`));

			assert.strictEqual(authReq.responseType, 'code');
			assert.strictEqual(authReq.clientId, client.client_id);
			assert.strictEqual(authReq.redirectUri, 'https://example.com/callback');
			assert.deepStrictEqual(authReq.scope, ['read']);
			assert.strictEqual(authReq.state, 'test123');

			// Test lookupClient
			const foundClient = await helpers.lookupClient(client.client_id);
			assert.ok(foundClient);
			assert.strictEqual(foundClient.clientId, client.client_id);

			return c.json({ success: true });
		});

		const testReq = new Request('http://localhost/test-helpers');
		const testRes = await app.request(testReq);
		assert.strictEqual(testRes.status, 200);

		const result = await testRes.json();
		assert.strictEqual(result.success, true);
	});

	it('should handle CORS preflight requests', async () => {
		const req = new Request('http://localhost/oauth/token', {
			method: 'OPTIONS',
			headers: {
				Origin: 'https://example.com',
			},
		});

		const res = await app.request(req);
		assert.strictEqual(res.status, 204);
		assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://example.com');
		assert.strictEqual(res.headers.get('Access-Control-Allow-Methods'), '*');
		assert.strictEqual(res.headers.get('Access-Control-Allow-Headers'), 'Authorization, *');
	});

	it('should reject invalid token requests', async () => {
		const req = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: 'grant_type=authorization_code&code=invalid',
		});

		const res = await app.request(req);
		assert.strictEqual(res.status, 401);

		const error = await res.json();
		assert.strictEqual(error.error, 'invalid_client');
	});

	it('should create auth middleware', () => {
		const middleware = provider.createAuthMiddleware();
		assert.ok(typeof middleware === 'function');
	});

	it('should handle invalid authorization header in auth middleware', async () => {
		const middleware = provider.createAuthMiddleware();

		app.get('/protected', middleware, async (c) => {
			return c.json({ success: true });
		});

		const req = new Request('http://localhost/protected');
		const res = await app.request(req);

		assert.strictEqual(res.status, 401);
		const error = await res.json();
		assert.strictEqual(error.error, 'invalid_token');
	});
});
