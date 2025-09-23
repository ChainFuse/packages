[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/ChainFuse/packages/badge)](https://securityscorecards.dev/viewer/?uri=github.com/ChainFuse/packages)[![Socket Badge](https://socket.dev/api/badge/npm/package/@chainfuse/hono-oauth-provider)](https://socket.dev/npm/package/@chainfuse/hono-oauth-provider)

![NPM Downloads](https://img.shields.io/npm/dw/@chainfuse/hono-oauth-provider)![npm bundle size](https://img.shields.io/bundlephobia/min/@chainfuse/hono-oauth-provider)![NPM Unpacked Size](https://img.shields.io/npm/unpacked-size/@chainfuse/hono-oauth-provider)

[![Build & Test](https://github.com/ChainFuse/packages/actions/workflows/test.yml/badge.svg)](https://github.com/ChainFuse/packages/actions/workflows/test.yml)[![Release](https://github.com/ChainFuse/packages/actions/workflows/changeset-release.yml/badge.svg)](https://github.com/ChainFuse/packages/actions/workflows/changeset-release.yml)

# @chainfuse/hono-oauth-provider

A comprehensive OAuth 2.1 provider implementation for Hono.js that creates a mini Hono app exposing all necessary OAuth endpoints and middleware for token validation.

## Features

- **OAuth 2.1 Compliant**: Implements the latest OAuth 2.1 specification with enhanced security
- **Authorization Code Flow**: Full support with PKCE (Proof Key for Code Exchange)
- **Refresh Token Flow**: Token refresh with rotation for enhanced security
- **Dynamic Client Registration**: RFC 7591 compliant client registration
- **Middleware Support**: Built-in authentication middleware for protected routes
- **Flexible Storage**: Callback-based storage interface - bring your own storage solution
- **TypeScript**: Full TypeScript support with comprehensive type definitions
- **Security Features**: Token encryption, PKCE support, secure token storage

## Installation

```bash
npm install @chainfuse/hono-oauth-provider hono
```

## Quick Start

```typescript
import { Hono } from 'hono';
import { OAuth21Provider, type OAuthStorageCallbacks } from '@chainfuse/hono-oauth-provider';

const app = new Hono();

// Implement your storage callbacks (this example uses in-memory storage)
const storage: OAuthStorageCallbacks = {
	async get<T>(key: string): Promise<T | null> {
		// Implement your get logic (e.g., Redis, database, etc.)
		// This is just an example - use persistent storage in production
		return (global as any).__storage?.get(key) ?? null;
	},

	async put(key: string, value: unknown, options?: { expirationTtl?: number }): Promise<void> {
		// Implement your put logic with optional TTL
		if (!(global as any).__storage) (global as any).__storage = new Map();
		(global as any).__storage.set(key, value);

		// Handle expiration if needed
		if (options?.expirationTtl) {
			setTimeout(() => {
				(global as any).__storage?.delete(key);
			}, options.expirationTtl * 1000);
		}
	},

	async delete(key: string): Promise<void> {
		// Implement your delete logic
		(global as any).__storage?.delete(key);
	},

	async list(options: { prefix: string; cursor?: string; limit?: number }) {
		// Implement your list logic with pagination
		const allKeys = Array.from((global as any).__storage?.keys() ?? []).filter((key: string) => key.startsWith(options.prefix));

		const limit = options.limit ?? 1000;
		const startIndex = options.cursor ? allKeys.indexOf(options.cursor) + 1 : 0;
		const keys = allKeys.slice(startIndex, startIndex + limit);

		return {
			keys: keys.map((name: string) => ({ name })),
			list_complete: startIndex + limit >= allKeys.length,
			cursor: keys.length > 0 ? keys[keys.length - 1] : undefined,
		};
	},
};

// Create OAuth provider
const oauth = new OAuth21Provider({
	authorizeEndpoint: '/oauth/authorize',
	tokenEndpoint: '/oauth/token',
	clientRegistrationEndpoint: '/oauth/register',
	storage,
	scopesSupported: ['read', 'write', 'admin'],
	accessTokenTTL: 3600, // 1 hour
});

// Mount OAuth routes
app.route('/oauth', oauth.app);

// Protected route using OAuth middleware
app.get('/api/*', oauth.createAuthMiddleware(), async (c) => {
	const user = c.user; // Access authenticated user info
	return c.json({
		message: 'Hello authenticated user!',
		userId: user.userId,
		clientId: user.clientId,
		scopes: user.scope,
		props: user.props,
	});
});

// Authorization endpoint (implement your own UI)
app.get('/oauth/authorize', async (c) => {
	const authRequest = await c.oauth.parseAuthRequest(c.req.raw);

	// Your authorization logic here
	// After user grants permission:

	const { redirectTo } = await c.oauth.completeAuthorization({
		request: authRequest,
		userId: 'user123',
		metadata: { timestamp: Date.now() },
		scope: ['read', 'write'],
		props: { customData: 'value' },
	});

	return c.redirect(redirectTo);
});

export default app;
```

## OAuth 2.1 Endpoints

The provider automatically exposes these endpoints:

- `GET /.well-known/oauth-authorization-server` - OAuth metadata discovery
- `POST /token` - Token issuance, refresh, and revocation
- `POST /register` - Dynamic client registration (if enabled)

## Storage Implementation

The OAuth provider uses a callback-based storage interface that you need to implement. Here are some examples:

### In-Memory Storage (Development Only)

```typescript
import { type OAuthStorageCallbacks } from '@chainfuse/hono-oauth-provider';

const memoryStorage: OAuthStorageCallbacks = {
	async get<T>(key: string): Promise<T | null> {
		const storage = (global as any).__oauthStorage || new Map();
		return storage.get(key) ?? null;
	},

	async put(key: string, value: unknown, options?: { expirationTtl?: number }): Promise<void> {
		if (!(global as any).__oauthStorage) (global as any).__oauthStorage = new Map();
		(global as any).__oauthStorage.set(key, value);

		if (options?.expirationTtl) {
			setTimeout(() => {
				(global as any).__oauthStorage?.delete(key);
			}, options.expirationTtl * 1000);
		}
	},

	async delete(key: string): Promise<void> {
		(global as any).__oauthStorage?.delete(key);
	},

	async list(options: { prefix: string; cursor?: string; limit?: number }) {
		const storage = (global as any).__oauthStorage || new Map();
		const allKeys = Array.from(storage.keys()).filter((key) => key.startsWith(options.prefix));

		const limit = options.limit ?? 1000;
		const startIndex = options.cursor ? allKeys.indexOf(options.cursor) + 1 : 0;
		const keys = allKeys.slice(startIndex, startIndex + limit);

		return {
			keys: keys.map((name) => ({ name })),
			list_complete: startIndex + limit >= allKeys.length,
			cursor: keys.length > 0 ? keys[keys.length - 1] : undefined,
		};
	},
};
```

### Redis Storage

```typescript
import Redis from 'ioredis';
import { type OAuthStorageCallbacks } from '@chainfuse/hono-oauth-provider';

const redis = new Redis(process.env.REDIS_URL);

const redisStorage: OAuthStorageCallbacks = {
	async get<T>(key: string): Promise<T | null> {
		const result = await redis.get(key);
		return result ? JSON.parse(result) : null;
	},

	async put(key: string, value: unknown, options?: { expirationTtl?: number }): Promise<void> {
		const serialized = JSON.stringify(value);
		if (options?.expirationTtl) {
			await redis.setex(key, options.expirationTtl, serialized);
		} else {
			await redis.set(key, serialized);
		}
	},

	async delete(key: string): Promise<void> {
		await redis.del(key);
	},

	async list(options: { prefix: string; cursor?: string; limit?: number }) {
		const { keys } = await redis.scan(options.cursor ? parseInt(options.cursor) : 0, 'MATCH', `${options.prefix}*`, 'COUNT', options.limit ?? 1000);

		return {
			keys: keys.map((name) => ({ name })),
			list_complete: keys.length < (options.limit ?? 1000),
			cursor: keys.length > 0 ? keys[keys.length - 1] : undefined,
		};
	},
};
```

### Cloudflare KV Storage

```typescript
import { type OAuthStorageCallbacks } from '@chainfuse/hono-oauth-provider';

// For Cloudflare Workers
const kvStorage: OAuthStorageCallbacks = {
	async get<T>(key: string): Promise<T | null> {
		return env.OAUTH_KV.get<T>(key, { type: 'json' });
	},

	async put(key: string, value: unknown, options?: { expirationTtl?: number }): Promise<void> {
		const putOptions: any = {};
		if (options?.expirationTtl) {
			putOptions.expirationTtl = options.expirationTtl;
		}
		await env.OAUTH_KV.put(key, JSON.stringify(value), putOptions);
	},

	async delete(key: string): Promise<void> {
		await env.OAUTH_KV.delete(key);
	},

	async list(options: { prefix: string; cursor?: string; limit?: number }) {
		const result = await env.OAUTH_KV.list({
			prefix: options.prefix,
			cursor: options.cursor,
			limit: options.limit,
		});

		return {
			keys: result.keys.map((key) => ({ name: key.name })),
			list_complete: result.list_complete,
			cursor: result.cursor,
		};
	},
};
```

## Examples

### Full Authorization Server

```typescript
import { Hono } from 'hono';
import { OAuth21Provider, type OAuthStorageCallbacks } from '@chainfuse/hono-oauth-provider';

const app = new Hono();

// Example: Redis-based storage implementation
const storage: OAuthStorageCallbacks = {
	async get<T>(key: string): Promise<T | null> {
		// Example with Redis or any other storage
		// const result = await redis.get(key);
		// return result ? JSON.parse(result) : null;
		return null; // Replace with your implementation
	},

	async put(key: string, value: unknown, options?: { expirationTtl?: number }): Promise<void> {
		// const serialized = JSON.stringify(value);
		// if (options?.expirationTtl) {
		//   await redis.setex(key, options.expirationTtl, serialized);
		// } else {
		//   await redis.set(key, serialized);
		// }
	},

	async delete(key: string): Promise<void> {
		// await redis.del(key);
	},

	async list(options: { prefix: string; cursor?: string; limit?: number }) {
		// Implementation depends on your storage solution
		// For Redis: use SCAN with MATCH pattern
		// For databases: use SQL LIKE queries
		// For cloud storage: use prefix-based listing APIs
		return {
			keys: [],
			list_complete: true,
			cursor: undefined,
		};
	},
};

const oauth = new OAuth21Provider({
	authorizeEndpoint: '/oauth/authorize',
	tokenEndpoint: '/oauth/token',
	clientRegistrationEndpoint: '/oauth/register',
	storage,
	scopesSupported: ['profile', 'email', 'read:posts', 'write:posts'],
	accessTokenTTL: 3600,
});

// Mount OAuth endpoints
app.route('/oauth', oauth.app);

// Authorization endpoint with custom UI
app.get('/oauth/authorize', async (c) => {
	const authRequest = await c.oauth.parseAuthRequest(c.req.raw);

	// In a real app, you'd show a consent screen
	// For this example, we'll auto-approve
	const { redirectTo } = await c.oauth.completeAuthorization({
		request: authRequest,
		userId: 'user123',
		metadata: {
			userAgent: c.req.header('User-Agent'),
			timestamp: Date.now(),
		},
		scope: authRequest.scope,
		props: {
			username: 'john_doe',
			email: 'john@example.com',
			roles: ['user'],
		},
	});

	return c.redirect(redirectTo);
});

// Protected API routes
app.get('/api/*', oauth.createAuthMiddleware(), async (c) => {
	const user = c.user;
	return c.json({
		message: 'Protected resource',
		user: {
			id: user.userId,
			client: user.clientId,
			scopes: user.scope,
			data: user.props,
		},
	});
});

export default app;
```

## API Reference

### `OAuth21Provider`

Main OAuth 2.1 provider class.

#### Constructor Options

```typescript
interface OAuth21ProviderOptions {
	authorizeEndpoint: string; // URL for authorization endpoint
	tokenEndpoint: string; // URL for token endpoint
	clientRegistrationEndpoint?: string; // URL for client registration (optional)
	accessTokenTTL?: number; // Access token TTL in seconds (default: 3600)
	scopesSupported?: string[]; // List of supported scopes
	allowImplicitFlow?: boolean; // Allow implicit flow (default: false)
	disallowPublicClientRegistration?: boolean; // Disallow public client registration (default: false)
	storage: OAuthStorageCallbacks; // Storage implementation callbacks
	tokenExchangeCallback?: TokenExchangeCallback; // Optional token exchange callback
	onError?: ErrorCallback; // Optional error handling callback
}
```

#### Storage Callbacks

```typescript
interface OAuthStorageCallbacks {
	get: <T>(key: string) => Promise<T | null>;
	put: (key: string, value: unknown, options?: { expirationTtl?: number }) => Promise<void>;
	delete: (key: string) => Promise<void>;
	list: (options: { prefix: string; cursor?: string; limit?: number }) => Promise<{
		keys: { name: string }[];
		list_complete: boolean;
		cursor?: string;
	}>;
}
```

### Methods

- `createAuthMiddleware()` - Creates middleware for protecting routes

## License

This project is licensed under the Apache-2.0 License - see the LICENSE file for details.
