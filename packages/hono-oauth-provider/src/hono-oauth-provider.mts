import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { z as z4 } from 'zod/v4';
import type { AuthRequest, CompleteAuthorizationOptions, Grant, GrantSummary, ListOptions, ListResult, OAuthContext, OAuthHelpers, TokenExchangeCallbackOptions } from './types.mjs';
import { clientInfo, oauth21ProviderOptions, token } from './types.mjs';

// Constants
const DEFAULT_ACCESS_TOKEN_TTL = 60 * 60; // 1 hour
const TOKEN_LENGTH = 32;

// Static HMAC key for wrapping key derivation
const WRAPPING_KEY_HMAC_KEY = new Uint8Array([0x22, 0x7e, 0x26, 0x86, 0x8d, 0xf1, 0xe1, 0x6d, 0x80, 0x70, 0xea, 0x17, 0x97, 0x5b, 0x47, 0xa6, 0x82, 0x18, 0xfa, 0x87, 0x28, 0xae, 0xde, 0x85, 0xb5, 0x1d, 0x4a, 0xd9, 0x96, 0xca, 0xca, 0x43]);

/**
 * OAuth 2.1 Provider for Hono
 * Creates a mini Hono app that can be mounted with `.route()` to handle OAuth endpoints
 */
export class OAuth21Provider {
	private options: z4.output<typeof oauth21ProviderOptions>;
	public app = new OpenAPIHono<{ Variables: OAuthContext }>();

	constructor(options: z4.input<typeof oauth21ProviderOptions>) {
		// Validate options using Zod schema
		this.options = oauth21ProviderOptions.parse(options);

		this.app.use('*', async (c, next) => {
			if (typeof c.var.oauth !== 'object') c.set('oauth', { helpers: new OAuthHelpersImpl(this.options.storage, this) });

			await next();
		});

		this.setupRoutes();
	}

	/**
	 * Create middleware that validates OAuth tokens and adds user context
	 */
	createAuthMiddleware() {
		return createMiddleware<{ Variables: OAuthContext }>((c, next) =>
			import('hono/bearer-auth').then(({ bearerAuth }) =>
				bearerAuth({
					realm: 'OAuth',
					headerName: 'Authorization',
					verifyToken: async (accessToken) => {
						// Parse the token to extract user ID and grant ID for parallel lookups
						const tokenParts = accessToken.split(':');
						if (tokenParts.length !== 3) return false;
						const [userId, grantId] = tokenParts;

						// Generate token ID from the full token
						const accessTokenId = await import('@chainfuse/helpers').then(({ CryptoHelpers }) => CryptoHelpers.getHash('SHA-256', accessToken));

						// Look up the token record, which now contains the denormalized grant information
						const tokenKey = `token:${userId}:${grantId}:${accessTokenId}`;
						const tokenDataRaw = await this.options.storage.get(tokenKey);
						const { data: tokenData, success: tokenDataSuccess } = token.safeParse(typeof tokenDataRaw === 'string' ? JSON.parse(tokenDataRaw) : tokenDataRaw);

						// Verify token
						if (!tokenDataSuccess) return false;

						// Check if token is expired (should be auto-deleted by KV TTL, but double-check)
						const now = Math.floor(Date.now() / 1000);
						if (tokenData.expiresAt < now) {
							this.options.onError({ code: 'invalid_token', description: 'Access token expired', status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="OAuth", error="invalid_token"' } });

							return false;
						}

						// Unwrap the encryption key and decrypt props
						const encryptionKey = await this.unwrapKeyWithToken(accessToken, tokenData.wrappedEncryptionKey);
						const decryptedProps = await this.decryptProps(encryptionKey, tokenData.grant.encryptedProps);

						// Add user context to the request
						if (typeof c.var.oauth !== 'object') c.set('oauth', { helpers: new OAuthHelpersImpl(this.options.storage, this) });
						c.var.oauth.user = {
							userId: tokenData.userId,
							clientId: tokenData.grant.clientId,
							scope: tokenData.grant.scope,
							props: decryptedProps,
						};

						return true;
					},
					noAuthenticationHeaderMessage: 'Missing or invalid access token',
					invalidAuthenticationHeaderMessage: 'Invalid token format',
					invalidTokenMessage: 'Invalid access token',
				})(c, next),
			),
		);
	}

	private setupRoutes(): void {
		// Add CORS middleware
		this.app.use('*', (c, next) =>
			import('hono/cors').then(({ cors }) =>
				cors({
					origin: (origin) => origin,
					allowMethods: ['*'],
					// Include Authorization explicitly since it's not included in * for security reasons
					allowHeaders: ['Authorization', '*'],
					maxAge: 24 * 60 * 60,
				})(c, next),
			),
		);

		// OAuth metadata discovery endpoint
		const OAuthMetadataSchema = z.looseObject({
			issuer: z.string(),
			authorization_endpoint: z.string(),
			token_endpoint: z.string(),
			registration_endpoint: z.string().optional(),
			scopes_supported: z.array(z.string()).optional(),
			response_types_supported: z.array(z.string()),
			response_modes_supported: z.array(z.string()).optional(),
			grant_types_supported: z.array(z.string()).optional(),
			token_endpoint_auth_methods_supported: z.array(z.string()).optional(),
			token_endpoint_auth_signing_alg_values_supported: z.array(z.string()).optional(),
			service_documentation: z.string().optional(),
			revocation_endpoint: z.string().optional(),
			revocation_endpoint_auth_methods_supported: z.array(z.string()).optional(),
			revocation_endpoint_auth_signing_alg_values_supported: z.array(z.string()).optional(),
			introspection_endpoint: z.string().optional(),
			introspection_endpoint_auth_methods_supported: z.array(z.string()).optional(),
			introspection_endpoint_auth_signing_alg_values_supported: z.array(z.string()).optional(),
			code_challenge_methods_supported: z.array(z.string()).optional(),
		});
		this.app.openapi(
			createRoute({
				method: 'get',
				path: '/.well-known/oauth-authorization-server',
				responses: {
					200: {
						content: {
							'application/json': {
								/**
								 * @link https://github.com/modelcontextprotocol/typescript-sdk/blob/main/src/shared/auth.ts#L28-L57
								 */
								schema: OAuthMetadataSchema,
							},
						},
						description: 'RFC 8414 OAuth 2.0 Authorization Server Metadata',
					},
				},
			}),
			(c) => {
				const url = new URL(c.req.url);

				const responseTypesSupported = ['code'];
				if (this.options.allowImplicitFlow) {
					responseTypesSupported.push('token');
				}

				return c.json({
					issuer: url.origin,
					authorization_endpoint: this.getFullEndpointUrl(this.options.authorizeEndpoint, url),
					token_endpoint: this.getFullEndpointUrl(this.options.tokenEndpoint, url),
					registration_endpoint: this.options.clientRegistrationEndpoint ? this.getFullEndpointUrl(this.options.clientRegistrationEndpoint, url) : undefined,
					scopes_supported: this.options.scopesSupported,
					response_types_supported: responseTypesSupported,
					response_modes_supported: ['query'],
					grant_types_supported: ['authorization_code', 'refresh_token'],
					token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
					revocation_endpoint: this.getFullEndpointUrl(this.options.tokenEndpoint, url),
					code_challenge_methods_supported: ['plain', 'S256'],
				} as z.input<typeof OAuthMetadataSchema>);
			},
		);

		// Token endpoint
		this.app.openapi(
			createRoute({
				method: 'post',
				path: '/token',
				request: {
					headers: z.object({
						Authorization: z
							.string()
							.trim()
							.nonempty()
							.regex(/Basic\s+.+/i)
							.transform((value) =>
								value
									.split(' ')
									// Remove the prefix
									.slice(1)
									// Merge back into a single string
									.join(' ')
									.trim(),
							)
							.optional(),
					}),
					body: {
						content: {
							'application/x-www-form-urlencoded': {
								schema: z.object({
									client_id: z.string().trim().nonempty().optional(),
									client_secret: z.string().trim().nonempty().optional(),
									grant_type: z.enum(['authorization_code', 'refresh_token']),
								}),
							},
						},
					},
				},
				responses: {},
			}),
			async (c) => {
				const body = c.req.valid('form');
				const { Authorization: credentials } = c.req.valid('header');

				let clientId: string | undefined;
				let clientSecret: string | undefined;

				if (credentials) {
					const [id, secret] = credentials.split(':', 2);
					if (id) clientId = decodeURIComponent(id);
					if (secret) clientSecret = decodeURIComponent(secret);
				} else {
					if (body.client_id) clientId = body.client_id;
					if (body.client_secret) clientSecret = body.client_secret;
				}

				if (!clientId) {
					return c.json({ error: 'invalid_client', error_description: 'Client ID is required' }, 401);
				}

				// Verify client exists
				const clientInfo = await this.getClient(clientId);
				if (!clientInfo) {
					return c.json({ error: 'invalid_client', error_description: 'Client not found' }, 401);
				}

				// Determine authentication requirements based on token endpoint auth method
				const isPublicClient = clientInfo.tokenEndpointAuthMethod === 'none';

				// For confidential clients, validate the secret
				if (!isPublicClient) {
					if (!clientSecret) {
						return c.json({ error: 'invalid_client', error_description: 'Client authentication failed: missing client_secret' }, 401);
					}

					// Verify the client secret matches
					if (!clientInfo.clientSecret) {
						return c.json({ error: 'invalid_client', error_description: 'Client authentication failed: client has no registered secret' }, 401);
					}

					const providedSecretHash = await import('@chainfuse/helpers').then(({ CryptoHelpers }) => CryptoHelpers.getHash('SHA-256', clientSecret));
					if (providedSecretHash !== clientInfo.clientSecret) {
						return c.json({ error: 'invalid_client', error_description: 'Client authentication failed: invalid client_secret' }, 401);
					}
				}
				// For public clients, no secret is required

				// Handle different grant types
				const grantType = body.grant_type;

				if (grantType === 'authorization_code') {
					return this.handleAuthorizationCodeGrant(body, clientInfo, env);
				} else if (grantType === 'refresh_token') {
					return this.handleRefreshTokenGrant(body, clientInfo, env);
				}
			},
		);

		// Client registration endpoint
		if (this.options.clientRegistrationEndpoint) {
			this.app.post('/register', async (c) => {
				return this.handleClientRegistration(c);
			});
		}
	}

	private async handleAuthorizationCodeGrant(c: Context, body: Record<string, unknown>, clientInfo: ClientInfo): Promise<Response> {
		const code = body['code'] as string;
		const redirectUri = body['redirect_uri'] as string;
		const codeVerifier = body['code_verifier'] as string;

		if (!code) {
			return this.createErrorResponse('invalid_request', 'Authorization code is required');
		}

		const codeParts = code.split(':');
		if (codeParts.length !== 3) {
			return this.createErrorResponse('invalid_grant', 'Invalid authorization code format');
		}

		const [userId, grantId] = codeParts;
		if (!userId || !grantId) {
			return this.createErrorResponse('invalid_grant', 'Invalid authorization code format');
		}
		const grantKey = `grant:${userId}:${grantId}`;
		const grantData = await this.options.storage.get<Grant>(grantKey);

		if (!grantData) {
			return this.createErrorResponse('invalid_grant', 'Grant not found or authorization code expired');
		}

		if (!grantData.authCodeId) {
			return this.createErrorResponse('invalid_grant', 'Authorization code already used');
		}

		const codeHash = await this.hashSecret(code);
		if (codeHash !== grantData.authCodeId) {
			return this.createErrorResponse('invalid_grant', 'Invalid authorization code');
		}

		if (grantData.clientId !== clientInfo.clientId) {
			return this.createErrorResponse('invalid_grant', 'Client ID mismatch');
		}

		const isPkceEnabled = Boolean(grantData.codeChallenge);

		if (!redirectUri && !isPkceEnabled) {
			return this.createErrorResponse('invalid_request', 'redirect_uri is required when not using PKCE');
		}

		if (redirectUri && !clientInfo.redirectUris.includes(redirectUri)) {
			return this.createErrorResponse('invalid_grant', 'Invalid redirect URI');
		}

		if (!isPkceEnabled && codeVerifier) {
			return this.createErrorResponse('invalid_request', 'code_verifier provided for a flow that did not use PKCE');
		}

		if (isPkceEnabled) {
			if (!codeVerifier) {
				return this.createErrorResponse('invalid_request', 'code_verifier is required for PKCE');
			}

			let calculatedChallenge: string;
			if (grantData.codeChallengeMethod === 'S256') {
				const encoder = new TextEncoder();
				const data = encoder.encode(codeVerifier);
				const hashBuffer = await crypto.subtle.digest('SHA-256', data);
				const hashArray = Array.from(new Uint8Array(hashBuffer));
				calculatedChallenge = this.base64UrlEncode(String.fromCharCode(...hashArray));
			} else {
				calculatedChallenge = codeVerifier;
			}

			if (calculatedChallenge !== grantData.codeChallenge) {
				return this.createErrorResponse('invalid_grant', 'Invalid PKCE code_verifier');
			}
		}

		// Generate tokens
		const accessTokenSecret = this.generateRandomString(TOKEN_LENGTH);
		const refreshTokenSecret = this.generateRandomString(TOKEN_LENGTH);

		const accessToken = `${userId}:${grantId}:${accessTokenSecret}`;
		const refreshToken = `${userId}:${grantId}:${refreshTokenSecret}`;

		const accessTokenId = await this.generateTokenId(accessToken);
		const refreshTokenId = await this.generateTokenId(refreshToken);

		let accessTokenTTL = this.options.accessTokenTTL;

		// Get encryption key
		const encryptionKey = await this.unwrapKeyWithToken(code, grantData.authCodeWrappedKey);

		let grantEncryptionKey = encryptionKey;
		let accessTokenEncryptionKey = encryptionKey;
		let encryptedAccessTokenProps = grantData.encryptedProps;

		// Process token exchange callback if provided
		if (this.options.tokenExchangeCallback) {
			const decryptedProps = await this.decryptProps(encryptionKey, grantData.encryptedProps);
			let grantProps = decryptedProps;
			let accessTokenProps = decryptedProps;

			const callbackOptions: TokenExchangeCallbackOptions = {
				grantType: 'authorization_code',
				clientId: clientInfo.clientId,
				userId: userId,
				scope: grantData.scope,
				props: decryptedProps,
			};

			const callbackResult = await Promise.resolve(this.options.tokenExchangeCallback(callbackOptions));

			if (callbackResult) {
				if (callbackResult.newProps) {
					grantProps = callbackResult.newProps;
					if (!callbackResult.accessTokenProps) {
						accessTokenProps = callbackResult.newProps;
					}
				}

				if (callbackResult.accessTokenProps) {
					accessTokenProps = callbackResult.accessTokenProps;
				}

				if (callbackResult.accessTokenTTL !== undefined) {
					accessTokenTTL = callbackResult.accessTokenTTL;
				}
			}

			// Re-encrypt props
			const grantResult = await this.encryptProps(grantProps);
			grantData.encryptedProps = grantResult.encryptedData;
			grantEncryptionKey = grantResult.key;

			if (accessTokenProps !== grantProps) {
				const tokenResult = await this.encryptProps(accessTokenProps);
				encryptedAccessTokenProps = tokenResult.encryptedData;
				accessTokenEncryptionKey = tokenResult.key;
			} else {
				encryptedAccessTokenProps = grantData.encryptedProps;
				accessTokenEncryptionKey = grantEncryptionKey;
			}
		}

		const now = Math.floor(Date.now() / 1000);
		const accessTokenExpiresAt = now + accessTokenTTL;

		// Wrap keys
		const accessTokenWrappedKey = await this.wrapKeyWithToken(accessToken, accessTokenEncryptionKey);
		const refreshTokenWrappedKey = await this.wrapKeyWithToken(refreshToken, grantEncryptionKey);

		// Update grant
		delete grantData.authCodeId;
		delete grantData.codeChallenge;
		delete grantData.codeChallengeMethod;
		delete grantData.authCodeWrappedKey;
		grantData.refreshTokenId = refreshTokenId;
		grantData.refreshTokenWrappedKey = refreshTokenWrappedKey;
		grantData.previousRefreshTokenId = undefined;
		grantData.previousRefreshTokenWrappedKey = undefined;

		await this.options.storage.put(grantKey, grantData);

		// Store access token
		const accessTokenData: Token = {
			id: accessTokenId,
			grantId: grantId,
			userId: userId,
			createdAt: now,
			expiresAt: accessTokenExpiresAt,
			wrappedEncryptionKey: accessTokenWrappedKey,
			grant: {
				clientId: grantData.clientId,
				scope: grantData.scope,
				encryptedProps: encryptedAccessTokenProps,
			},
		};

		await this.options.storage.put(`token:${userId}:${grantId}:${accessTokenId}`, accessTokenData, {
			expirationTtl: accessTokenTTL,
		});

		return c.json({
			access_token: accessToken,
			token_type: 'bearer',
			expires_in: accessTokenTTL,
			refresh_token: refreshToken,
			scope: grantData.scope.join(' '),
		});
	}

	private async handleRefreshTokenGrant(c: Context, body: Record<string, unknown>, clientInfo: ClientInfo): Promise<Response> {
		const refreshToken = body['refresh_token'] as string;

		if (!refreshToken) {
			return this.createErrorResponse('invalid_request', 'Refresh token is required');
		}

		const tokenParts = refreshToken.split(':');
		if (tokenParts.length !== 3) {
			return this.createErrorResponse('invalid_grant', 'Invalid token format');
		}

		const [userId, grantId] = tokenParts;
		if (!userId || !grantId) {
			return this.createErrorResponse('invalid_grant', 'Invalid token format');
		}
		const providedTokenHash = await this.generateTokenId(refreshToken);

		const grantKey = `grant:${userId}:${grantId}`;
		const grantData = await this.options.storage.get<Grant>(grantKey);

		if (!grantData) {
			return this.createErrorResponse('invalid_grant', 'Grant not found');
		}

		const isCurrentToken = grantData.refreshTokenId === providedTokenHash;
		const isPreviousToken = grantData.previousRefreshTokenId === providedTokenHash;

		if (!isCurrentToken && !isPreviousToken) {
			return this.createErrorResponse('invalid_grant', 'Invalid refresh token');
		}

		if (grantData.clientId !== clientInfo.clientId) {
			return this.createErrorResponse('invalid_grant', 'Client ID mismatch');
		}

		// Generate new tokens
		const accessTokenSecret = this.generateRandomString(TOKEN_LENGTH);
		const newAccessToken = `${userId}:${grantId}:${accessTokenSecret}`;
		const accessTokenId = await this.generateTokenId(newAccessToken);

		const refreshTokenSecret = this.generateRandomString(TOKEN_LENGTH);
		const newRefreshToken = `${userId}:${grantId}:${refreshTokenSecret}`;
		const newRefreshTokenId = await this.generateTokenId(newRefreshToken);

		let accessTokenTTL = this.options.accessTokenTTL;

		// Determine which wrapped key to use
		let wrappedKeyToUse: string;
		if (isCurrentToken) {
			wrappedKeyToUse = grantData.refreshTokenWrappedKey!;
		} else {
			wrappedKeyToUse = grantData.previousRefreshTokenWrappedKey!;
		}

		const encryptionKey = await this.unwrapKeyWithToken(refreshToken, wrappedKeyToUse);

		let grantEncryptionKey = encryptionKey;
		let accessTokenEncryptionKey = encryptionKey;
		let encryptedAccessTokenProps = grantData.encryptedProps;

		// Process token exchange callback if provided
		if (this.options.tokenExchangeCallback) {
			const decryptedProps = await this.decryptProps(encryptionKey, grantData.encryptedProps);
			let grantProps = decryptedProps;
			let accessTokenProps = decryptedProps;

			const callbackOptions: TokenExchangeCallbackOptions = {
				grantType: 'refresh_token',
				clientId: clientInfo.clientId,
				userId: userId,
				scope: grantData.scope,
				props: decryptedProps,
			};

			const callbackResult = await Promise.resolve(this.options.tokenExchangeCallback(callbackOptions));

			let grantPropsChanged = false;
			if (callbackResult) {
				if (callbackResult.newProps) {
					grantProps = callbackResult.newProps;
					grantPropsChanged = true;
					if (!callbackResult.accessTokenProps) {
						accessTokenProps = callbackResult.newProps;
					}
				}

				if (callbackResult.accessTokenProps) {
					accessTokenProps = callbackResult.accessTokenProps;
				}

				if (callbackResult.accessTokenTTL !== undefined) {
					accessTokenTTL = callbackResult.accessTokenTTL;
				}
			}

			// Re-encrypt props if changed
			if (grantPropsChanged) {
				const grantResult = await this.encryptProps(grantProps);
				grantData.encryptedProps = grantResult.encryptedData;

				if (grantResult.key !== encryptionKey) {
					grantEncryptionKey = grantResult.key;
					wrappedKeyToUse = await this.wrapKeyWithToken(refreshToken, grantEncryptionKey);
				} else {
					grantEncryptionKey = grantResult.key;
				}
			}

			if (accessTokenProps !== grantProps) {
				const tokenResult = await this.encryptProps(accessTokenProps);
				encryptedAccessTokenProps = tokenResult.encryptedData;
				accessTokenEncryptionKey = tokenResult.key;
			} else {
				encryptedAccessTokenProps = grantData.encryptedProps;
				accessTokenEncryptionKey = grantEncryptionKey;
			}
		}

		const now = Math.floor(Date.now() / 1000);
		const accessTokenExpiresAt = now + accessTokenTTL;

		// Wrap keys
		const accessTokenWrappedKey = await this.wrapKeyWithToken(newAccessToken, accessTokenEncryptionKey);
		const newRefreshTokenWrappedKey = await this.wrapKeyWithToken(newRefreshToken, grantEncryptionKey);

		// Update grant with token rotation
		grantData.previousRefreshTokenId = providedTokenHash;
		grantData.previousRefreshTokenWrappedKey = wrappedKeyToUse;
		grantData.refreshTokenId = newRefreshTokenId;
		grantData.refreshTokenWrappedKey = newRefreshTokenWrappedKey;

		await this.options.storage.put(grantKey, grantData);

		// Store new access token
		const accessTokenData: Token = {
			id: accessTokenId,
			grantId: grantId,
			userId: userId,
			createdAt: now,
			expiresAt: accessTokenExpiresAt,
			wrappedEncryptionKey: accessTokenWrappedKey,
			grant: {
				clientId: grantData.clientId,
				scope: grantData.scope,
				encryptedProps: encryptedAccessTokenProps,
			},
		};

		await this.options.storage.put(`token:${userId}:${grantId}:${accessTokenId}`, accessTokenData, {
			expirationTtl: accessTokenTTL,
		});

		return c.json({
			access_token: newAccessToken,
			token_type: 'bearer',
			expires_in: accessTokenTTL,
			refresh_token: newRefreshToken,
			scope: grantData.scope.join(' '),
		});
	}

	private async handleClientRegistration(c: Context): Promise<Response> {
		if (!this.options.clientRegistrationEndpoint) {
			return this.createErrorResponse('not_implemented', 'Client registration is not enabled', 501);
		}

		const contentLength = parseInt(c.req.header('Content-Length') ?? '0', 10);
		if (contentLength > 1048576) {
			return this.createErrorResponse('invalid_request', 'Request payload too large, must be under 1 MiB', 413);
		}

		let clientMetadata: Record<string, unknown>;
		try {
			const text = await c.req.text();
			if (text.length > 1048576) {
				return this.createErrorResponse('invalid_request', 'Request payload too large, must be under 1 MiB', 413);
			}
			clientMetadata = JSON.parse(text) as Record<string, unknown>;
		} catch {
			return this.createErrorResponse('invalid_request', 'Invalid JSON payload', 400);
		}

		const validateStringField = (field: unknown): string | undefined => {
			if (field === undefined) {
				return undefined;
			}
			if (typeof field !== 'string') {
				throw new Error('Field must be a string');
			}
			return field;
		};

		const validateStringArray = (arr: unknown): string[] | undefined => {
			if (arr === undefined) {
				return undefined;
			}
			if (!Array.isArray(arr)) {
				throw new Error('Field must be an array');
			}

			for (const item of arr) {
				if (typeof item !== 'string') {
					throw new Error('All array elements must be strings');
				}
			}

			return arr as string[];
		};

		const authMethod = validateStringField(clientMetadata['token_endpoint_auth_method']) ?? 'client_secret_basic';
		const isPublicClient = authMethod === 'none';

		if (isPublicClient && this.options.disallowPublicClientRegistration) {
			return this.createErrorResponse('invalid_client_metadata', 'Public client registration is not allowed');
		}

		const clientId = this.generateRandomString(16);

		let clientSecret: string | undefined;
		let hashedSecret: string | undefined;

		if (!isPublicClient) {
			clientSecret = this.generateRandomString(32);
			hashedSecret = await this.hashSecret(clientSecret);
		}

		let clientInfo: ClientInfo;
		try {
			const redirectUris = validateStringArray(clientMetadata['redirect_uris']);
			if (!redirectUris || redirectUris.length === 0) {
				throw new Error('At least one redirect URI is required');
			}

			clientInfo = {
				clientId,
				redirectUris,
				clientName: validateStringField(clientMetadata['client_name']),
				logoUri: validateStringField(clientMetadata['logo_uri']),
				clientUri: validateStringField(clientMetadata['client_uri']),
				policyUri: validateStringField(clientMetadata['policy_uri']),
				tosUri: validateStringField(clientMetadata['tos_uri']),
				jwksUri: validateStringField(clientMetadata['jwks_uri']),
				contacts: validateStringArray(clientMetadata['contacts']),
				grantTypes: validateStringArray(clientMetadata['grant_types']) ?? ['authorization_code', 'refresh_token'],
				responseTypes: validateStringArray(clientMetadata['response_types']) ?? ['code'],
				registrationDate: Math.floor(Date.now() / 1000),
				tokenEndpointAuthMethod: authMethod,
			};

			if (!isPublicClient && hashedSecret) {
				clientInfo.clientSecret = hashedSecret;
			}
		} catch (error) {
			return this.createErrorResponse('invalid_client_metadata', error instanceof Error ? error.message : 'Invalid client metadata');
		}

		await this.options.storage.put(`client:${clientId}`, clientInfo);

		const response: Record<string, unknown> = {
			client_id: clientInfo.clientId,
			redirect_uris: clientInfo.redirectUris,
			client_name: clientInfo.clientName,
			logo_uri: clientInfo.logoUri,
			client_uri: clientInfo.clientUri,
			policy_uri: clientInfo.policyUri,
			tos_uri: clientInfo.tosUri,
			jwks_uri: clientInfo.jwksUri,
			contacts: clientInfo.contacts,
			grant_types: clientInfo.grantTypes,
			response_types: clientInfo.responseTypes,
			token_endpoint_auth_method: clientInfo.tokenEndpointAuthMethod,
			registration_client_uri: `${this.options.clientRegistrationEndpoint}/${clientId}`,
			client_id_issued_at: clientInfo.registrationDate,
		};

		if (clientSecret) {
			response['client_secret'] = clientSecret;
		}

		return c.json(response, 201);
	}

	private createErrorResponse(code: string, description: string, status = 400, headers: Record<string, string> = {}): Response {
		const customErrorResponse = this.options.onError?.({ code, description, status, headers });
		if (customErrorResponse) return customErrorResponse;

		const responseHeaders = new Headers();
		responseHeaders.set('Content-Type', 'application/json');

		// Add custom headers
		if (headers) {
			for (const [key, value] of Object.entries(headers)) {
				responseHeaders.set(key, value);
			}
		}

		return new Response(
			JSON.stringify({
				error: code,
				error_description: description,
			}),
			{
				status,
				headers: responseHeaders,
			},
		);
	}

	private getFullEndpointUrl(endpoint: string, requestUrl: URL): string {
		if (endpoint.startsWith('/')) {
			return new URL(endpoint, requestUrl.origin).toString();
		} else {
			return endpoint;
		}
	}

	async getClient(clientId: string) {
		const clientKey = `client:${clientId}`;
		const clientDataRaw = await this.options.storage.get(clientKey);

		if (clientDataRaw) {
			return clientInfo.parseAsync(typeof clientDataRaw === 'string' ? JSON.parse(clientDataRaw) : clientDataRaw);
		} else {
			return null;
		}
	}

	// Utility method
	private async encryptProps(data: Record<string, unknown>): Promise<{ encryptedData: string; key: CryptoKey }> {
		const key: CryptoKey = await crypto.subtle.generateKey(
			{
				name: 'AES-GCM',
				length: 256,
			},
			true,
			['encrypt', 'decrypt'],
		);

		const iv = new Uint8Array(12);
		const jsonData = JSON.stringify(data);
		const encoder = new TextEncoder();
		const encodedData = encoder.encode(jsonData);

		const encryptedBuffer = await crypto.subtle.encrypt(
			{
				name: 'AES-GCM',
				iv,
			},
			key,
			encodedData,
		);

		return {
			encryptedData: this.arrayBufferToBase64(encryptedBuffer),
			key,
		};
	}

	private async decryptProps(key: CryptoKey, encryptedData: string): Promise<Record<string, unknown>> {
		const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
		const iv = new Uint8Array(12);

		const decryptedBuffer = await crypto.subtle.decrypt(
			{
				name: 'AES-GCM',
				iv,
			},
			key,
			encryptedBuffer,
		);

		const decoder = new TextDecoder();
		const jsonData = decoder.decode(decryptedBuffer);
		return JSON.parse(jsonData) as Record<string, unknown>;
	}

	private async deriveKeyFromToken(tokenStr: string): Promise<CryptoKey> {
		const encoder = new TextEncoder();

		const hmacKey = await crypto.subtle.importKey('raw', WRAPPING_KEY_HMAC_KEY, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

		const hmacResult = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(tokenStr));

		return await crypto.subtle.importKey('raw', hmacResult, { name: 'AES-KW' }, false, ['wrapKey', 'unwrapKey']);
	}

	private async wrapKeyWithToken(tokenStr: string, keyToWrap: CryptoKey): Promise<string> {
		const wrappingKey = await this.deriveKeyFromToken(tokenStr);
		const wrappedKeyBuffer = await crypto.subtle.wrapKey('raw', keyToWrap, wrappingKey, { name: 'AES-KW' });
		return import('@chainfuse/helpers').then(({ BufferHelpers }) => BufferHelpers.bufferToBase64(wrappedKeyBuffer, false));
	}

	private async unwrapKeyWithToken(tokenStr: string, wrappedKeyBase64: string): Promise<CryptoKey> {
		const wrappingKey = await this.deriveKeyFromToken(tokenStr);
		const wrappedKeyBuffer = await import('@chainfuse/helpers').then(({ BufferHelpers }) => BufferHelpers.base64ToBuffer(wrappedKeyBase64));

		return await crypto.subtle.unwrapKey('raw', wrappedKeyBuffer, wrappingKey, { name: 'AES-KW' }, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
	}
}

/**
 * Implementation of OAuth helpers
 */
class OAuthHelpersImpl implements OAuthHelpers {
	constructor(
		private storage: z4.output<typeof oauth21ProviderOptions>['storage'],
		private provider: OAuth21Provider,
	) {}

	async parseAuthRequest(request: Request): Promise<AuthRequest> {
		const url = new URL(request.url);
		const responseType = url.searchParams.get('response_type') || '';
		const clientId = url.searchParams.get('client_id') || '';
		const redirectUri = url.searchParams.get('redirect_uri') || '';
		const scope = (url.searchParams.get('scope') || '').split(' ').filter(Boolean);
		const state = url.searchParams.get('state') || '';
		const codeChallenge = url.searchParams.get('code_challenge') || undefined;
		const codeChallengeMethod = url.searchParams.get('code_challenge_method') || 'plain';

		// Validate client and redirect URI
		if (clientId) {
			const clientInfo = await this.lookupClient(clientId);
			if (clientInfo && redirectUri) {
				if (!clientInfo.redirectUris.includes(redirectUri)) {
					throw new Error(`Invalid redirect URI. The redirect URI provided does not match any registered URI for this client.`);
				}
			}
		}

		return {
			responseType,
			clientId,
			redirectUri,
			scope,
			state,
			codeChallenge,
			codeChallengeMethod,
		};
	}

	async lookupClient(clientId: string): Promise<ClientInfo | null> {
		return await this.provider.getClient(clientId);
	}

	async completeAuthorization(options: CompleteAuthorizationOptions): Promise<{ redirectTo: string }> {
		const grantId = this.generateRandomString(16);
		const { encryptedData, key: encryptionKey } = await this.encryptProps(options.props);
		const now = Math.floor(Date.now() / 1000);

		if (options.request.responseType === 'token') {
			// Implicit flow
			const accessTokenSecret = this.generateRandomString(TOKEN_LENGTH);
			const accessToken = `${options.userId}:${grantId}:${accessTokenSecret}`;
			const accessTokenId = await this.generateTokenId(accessToken);
			const accessTokenTTL = DEFAULT_ACCESS_TOKEN_TTL;
			const accessTokenExpiresAt = now + accessTokenTTL;

			const accessTokenWrappedKey = await this.wrapKeyWithToken(accessToken, encryptionKey);

			const grant: Grant = {
				id: grantId,
				clientId: options.request.clientId,
				userId: options.userId,
				scope: options.scope,
				metadata: options.metadata,
				encryptedProps: encryptedData,
				createdAt: now,
			};

			const grantKey = `grant:${options.userId}:${grantId}`;
			await this.storage.put(grantKey, grant);

			const accessTokenData: Token = {
				id: accessTokenId,
				grantId: grantId,
				userId: options.userId,
				createdAt: now,
				expiresAt: accessTokenExpiresAt,
				wrappedEncryptionKey: accessTokenWrappedKey,
				grant: {
					clientId: options.request.clientId,
					scope: options.scope,
					encryptedProps: encryptedData,
				},
			};

			await this.storage.put(`token:${options.userId}:${grantId}:${accessTokenId}`, accessTokenData, {
				expirationTtl: accessTokenTTL,
			});

			const redirectUrl = new URL(options.request.redirectUri);
			const fragment = new URLSearchParams();
			fragment.set('access_token', accessToken);
			fragment.set('token_type', 'bearer');
			fragment.set('expires_in', accessTokenTTL.toString());
			fragment.set('scope', options.scope.join(' '));

			if (options.request.state) {
				fragment.set('state', options.request.state);
			}

			redirectUrl.hash = fragment.toString();
			return { redirectTo: redirectUrl.toString() };
		} else {
			// Authorization code flow
			const authCodeSecret = this.generateRandomString(32);
			const authCode = `${options.userId}:${grantId}:${authCodeSecret}`;
			const authCodeId = await this.hashSecret(authCode);
			const authCodeWrappedKey = await this.wrapKeyWithToken(authCode, encryptionKey);

			const grant: Grant = {
				id: grantId,
				clientId: options.request.clientId,
				userId: options.userId,
				scope: options.scope,
				metadata: options.metadata,
				encryptedProps: encryptedData,
				createdAt: now,
				authCodeId: authCodeId,
				authCodeWrappedKey: authCodeWrappedKey,
				codeChallenge: options.request.codeChallenge,
				codeChallengeMethod: options.request.codeChallengeMethod,
			};

			const grantKey = `grant:${options.userId}:${grantId}`;
			const codeExpiresIn = 600; // 10 minutes
			await this.storage.put(grantKey, grant, { expirationTtl: codeExpiresIn });

			const redirectUrl = new URL(options.request.redirectUri);
			redirectUrl.searchParams.set('code', authCode);
			if (options.request.state) {
				redirectUrl.searchParams.set('state', options.request.state);
			}

			return { redirectTo: redirectUrl.toString() };
		}
	}

	async createClient(clientInfo: Partial<ClientInfo>): Promise<ClientInfo> {
		const clientId = this.generateRandomString(16);
		const tokenEndpointAuthMethod = clientInfo.tokenEndpointAuthMethod || 'client_secret_basic';
		const isPublicClient = tokenEndpointAuthMethod === 'none';

		const newClient: ClientInfo = {
			clientId,
			redirectUris: clientInfo.redirectUris || [],
			clientName: clientInfo.clientName,
			logoUri: clientInfo.logoUri,
			clientUri: clientInfo.clientUri,
			policyUri: clientInfo.policyUri,
			tosUri: clientInfo.tosUri,
			jwksUri: clientInfo.jwksUri,
			contacts: clientInfo.contacts,
			grantTypes: clientInfo.grantTypes || ['authorization_code', 'refresh_token'],
			responseTypes: clientInfo.responseTypes || ['code'],
			registrationDate: Math.floor(Date.now() / 1000),
			tokenEndpointAuthMethod,
		};

		let clientSecret: string | undefined;
		if (!isPublicClient) {
			clientSecret = this.generateRandomString(32);
			newClient.clientSecret = await this.hashSecret(clientSecret);
		}

		await this.storage.put(`client:${clientId}`, newClient);

		const clientResponse = { ...newClient };
		if (!isPublicClient && clientSecret) {
			clientResponse.clientSecret = clientSecret;
		}

		return clientResponse;
	}

	async listClients(options?: ListOptions): Promise<ListResult<ClientInfo>> {
		const listOptions: { limit?: number; cursor?: string; prefix: string } = {
			prefix: 'client:',
		};

		if (options?.limit !== undefined) {
			listOptions.limit = options.limit;
		}

		if (options?.cursor !== undefined) {
			listOptions.cursor = options.cursor;
		}

		const response = await this.storage.list(listOptions);
		const clients: ClientInfo[] = [];

		const promises = response.keys.map(async (key: { name: string }) => {
			const clientId = key.name.substring('client:'.length);
			const client = await this.provider.getClient(clientId);
			if (client) {
				clients.push(client);
			}
		});

		await Promise.all(promises);

		return {
			items: clients,
			cursor: response.list_complete ? undefined : response.cursor,
		};
	}

	async updateClient(clientId: string, updates: Partial<ClientInfo>): Promise<ClientInfo | null> {
		const client = await this.provider.getClient(clientId);
		if (!client) {
			return null;
		}

		const authMethod = updates.tokenEndpointAuthMethod || client.tokenEndpointAuthMethod || 'client_secret_basic';
		const isPublicClient = authMethod === 'none';

		let secretToStore = client.clientSecret;
		let originalSecret: string | undefined = undefined;

		if (isPublicClient) {
			secretToStore = undefined;
		} else if (updates.clientSecret) {
			originalSecret = updates.clientSecret;
			secretToStore = await this.hashSecret(updates.clientSecret);
		}

		const updatedClient: ClientInfo = {
			...client,
			...updates,
			clientId: client.clientId,
			tokenEndpointAuthMethod: authMethod,
		};

		if (!isPublicClient && secretToStore) {
			updatedClient.clientSecret = secretToStore;
		} else {
			delete updatedClient.clientSecret;
		}

		await this.storage.put(`client:${clientId}`, updatedClient);

		const response = { ...updatedClient };
		if (!isPublicClient && originalSecret) {
			response.clientSecret = originalSecret;
		}

		return response;
	}

	async deleteClient(clientId: string): Promise<void> {
		await this.storage.delete(`client:${clientId}`);
	}

	async listUserGrants(userId: string, options?: ListOptions): Promise<ListResult<GrantSummary>> {
		const listOptions: { limit?: number; cursor?: string; prefix: string } = {
			prefix: `grant:${userId}:`,
		};

		if (options?.limit !== undefined) {
			listOptions.limit = options.limit;
		}

		if (options?.cursor !== undefined) {
			listOptions.cursor = options.cursor;
		}

		const response = await this.storage.list(listOptions);
		const grantSummaries: GrantSummary[] = [];

		const promises = response.keys.map(async (key: { name: string }) => {
			const grantData = await this.storage.get<Grant>(key.name);
			if (grantData) {
				const summary: GrantSummary = {
					id: grantData.id,
					clientId: grantData.clientId,
					userId: grantData.userId,
					scope: grantData.scope,
					metadata: grantData.metadata,
					createdAt: grantData.createdAt,
				};
				grantSummaries.push(summary);
			}
		});

		await Promise.all(promises);

		return {
			items: grantSummaries,
			cursor: response.list_complete ? undefined : response.cursor,
		};
	}

	async revokeGrant(grantId: string, userId: string): Promise<void> {
		const grantKey = `grant:${userId}:${grantId}`;
		const tokenPrefix = `token:${userId}:${grantId}:`;

		let cursor: string | undefined;
		let allTokensDeleted = false;

		while (!allTokensDeleted) {
			const listOptions: { prefix: string; cursor?: string } = {
				prefix: tokenPrefix,
			};

			if (cursor) {
				listOptions.cursor = cursor;
			}

			const result = await this.storage.list(listOptions);

			if (result.keys.length > 0) {
				await Promise.all(result.keys.map((key: { name: string }) => this.storage.delete(key.name)));
			}

			if (result.list_complete) {
				allTokensDeleted = true;
			} else {
				cursor = result.cursor;
			}
		}

		await this.storage.delete(grantKey);
	}

	// Helper methods
	private generateRandomString(length: number): string {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		const values = new Uint8Array(length);
		crypto.getRandomValues(values);

		for (let i = 0; i < length; i++) {
			result += characters.charAt(values[i]! % characters.length);
		}
		return result;
	}

	private async generateTokenId(token: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(token);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
		return hashHex;
	}

	private async hashSecret(secret: string): Promise<string> {
		return this.generateTokenId(secret);
	}

	private async encryptProps(data: Record<string, unknown>): Promise<{ encryptedData: string; key: CryptoKey }> {
		const key: CryptoKey = await crypto.subtle.generateKey(
			{
				name: 'AES-GCM',
				length: 256,
			},
			true,
			['encrypt', 'decrypt'],
		);

		const iv = new Uint8Array(12);
		const jsonData = JSON.stringify(data);
		const encoder = new TextEncoder();
		const encodedData = encoder.encode(jsonData);

		const encryptedBuffer = await crypto.subtle.encrypt(
			{
				name: 'AES-GCM',
				iv,
			},
			key,
			encodedData,
		);

		return {
			encryptedData: this.arrayBufferToBase64(encryptedBuffer),
			key,
		};
	}

	private arrayBufferToBase64(buffer: ArrayBuffer): string {
		return btoa(String.fromCharCode(...new Uint8Array(buffer)));
	}

	private async wrapKeyWithToken(tokenStr: string, keyToWrap: CryptoKey): Promise<string> {
		const wrappingKey = await this.deriveKeyFromToken(tokenStr);
		const wrappedKeyBuffer = await crypto.subtle.wrapKey('raw', keyToWrap, wrappingKey, { name: 'AES-KW' });
		return this.arrayBufferToBase64(wrappedKeyBuffer);
	}

	private async deriveKeyFromToken(tokenStr: string): Promise<CryptoKey> {
		const encoder = new TextEncoder();

		const hmacKey = await crypto.subtle.importKey('raw', WRAPPING_KEY_HMAC_KEY, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

		const hmacResult = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(tokenStr));

		return await crypto.subtle.importKey('raw', hmacResult, { name: 'AES-KW' }, false, ['wrapKey', 'unwrapKey']);
	}
}
