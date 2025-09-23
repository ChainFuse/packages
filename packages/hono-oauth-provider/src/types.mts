import { z as z4 } from 'zod/v4';

/**
 * Zod schema for OAuth 2.1 Provider Options validation
 * Note: Function validation is simplified to avoid Zod v4 function API complexities
 */
export const oauth21ProviderOptions = z4.object({
	/**
	 * URL of the OAuth authorization endpoint where users can grant permissions.
	 * This URL is used in OAuth metadata and is not handled by the provider itself.
	 */
	authorizeEndpoint: z4.url(),
	/**
	 * URL of the token endpoint which the provider will implement.
	 * This endpoint handles token issuance, refresh, and revocation.
	 */
	tokenEndpoint: z4.url(),
	/**
	 * Optional URL for the client registration endpoint.
	 * If provided, the provider will implement dynamic client registration.
	 */
	clientRegistrationEndpoint: z4.url().optional(),
	/**
	 * Time-to-live for access tokens in seconds.
	 * @default 1 hour (3600 seconds)
	 */
	accessTokenTTL: z4.coerce
		.number()
		.int()
		.positive()
		.max(86400, 'Access token TTL cannot exceed 24 hours')
		.default(60 * 60),
	/**
	 * List of scopes supported by this OAuth provider.
	 * If not provided, the 'scopes_supported' field will be omitted from the OAuth metadata.
	 */
	scopesSupported: z4.array(z4.string().nonempty()).nonempty().optional(),
	/**
	 * Controls whether the OAuth implicit flow is allowed.
	 * This flow is discouraged in OAuth 2.1 due to security concerns.
	 * @default false
	 */
	allowImplicitFlow: z4.boolean().default(false),
	/**
	 * Controls whether public clients (clients without a secret, like SPAs)
	 * can register via the dynamic client registration endpoint.
	 * @default false
	 */
	disallowPublicClientRegistration: z4.boolean().default(false),
	/**
	 * Storage callbacks for OAuth data persistence
	 */
	storage: z4.object({
		/**
		 * Get a value from storage
		 * @param key - The storage key
		 * @returns A Promise resolving to the value or null if not found
		 */
		get: z4
			.any()
			.refine((val) => typeof val === 'function', { error: 'get must be an async function' })
			.transform((val) => val as (key: string) => Promise<string | object | null>),
		/**
		 * Set a value in storage
		 * @param key - The storage key
		 * @param value - The value to store (always pre-stringified JSON)
		 * @param options - Optional settings like expiration
		 * @returns A Promise resolving when the operation completes
		 */
		put: z4
			.any()
			.refine((val) => typeof val === 'function', { error: 'put must be an async function' })
			.transform((val) => val as (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>),
		/**
		 * Delete a value from storage
		 * @param key - The storage key
		 * @returns A Promise resolving when the operation completes
		 */
		delete: z4
			.any()
			.refine((val) => typeof val === 'function', { error: 'delete must be an async function' })
			.transform((val) => val as (key: string) => Promise<void>),
	}),
	/**
	 * Optional callback function that is called during token exchange.
	 * This allows updating the props stored in both the access token and the grant.
	 */
	tokenExchangeCallback: z4
		.any()
		.refine((val) => typeof val === 'function', { error: 'tokenExchangeCallback must be a function' })
		.transform((val) => val as (options: TokenExchangeCallbackOptions) => Promise<TokenExchangeCallbackResult | void> | TokenExchangeCallbackResult | void)
		.optional(),
	/**
	 * Optional callback function that is called whenever the OAuthProvider returns an error response
	 * This allows the client to emit notifications or perform other actions when an error occurs.
	 *
	 * If the function returns a Response, that will be used in place of the OAuthProvider's default one.
	 */
	onError: z4
		.any()
		.refine((val) => typeof val === 'function', { error: 'onError must be a function' })
		.transform((val) => val as OAuthErrorCallback)
		.default(({ status, code, description }: Parameters<OAuthErrorCallback>[0]) => console.warn(`OAuth error response: ${status} ${code} - ${description}`)),
});

/**
 * Options for token exchange callback functions
 */
export interface TokenExchangeCallbackOptions {
	/**
	 * The type of grant being processed.
	 * 'authorization_code' for initial code exchange,
	 * 'refresh_token' for refresh token exchange.
	 */
	grantType: 'authorization_code' | 'refresh_token';

	/**
	 * Client that received this grant
	 */
	clientId: string;

	/**
	 * User who authorized this grant
	 */
	userId: string;

	/**
	 * List of scopes that were granted
	 */
	scope: string[];

	/**
	 * Application-specific properties currently associated with this grant
	 */
	props: Record<string, unknown>;
}

/**
 * Result of a token exchange callback function.
 * Allows updating the props stored in both the access token and the grant.
 */
export interface TokenExchangeCallbackResult {
	/**
	 * New props to be stored specifically with the access token.
	 * If not provided but newProps is, the access token will use newProps.
	 * If neither is provided, the original props will be used.
	 */
	accessTokenProps?: Record<string, unknown>;

	/**
	 * New props to replace the props stored in the grant itself.
	 * These props will be used for all future token refreshes.
	 * If accessTokenProps is not provided, these props will also be used for the current access token.
	 * If not provided, the original props will be used.
	 */
	newProps?: Record<string, unknown>;

	/**
	 * Override the default access token TTL (time-to-live) for this specific token.
	 * This is especially useful when the application is also an OAuth client to another service
	 * and wants to match its access token TTL to the upstream access token TTL.
	 * Value should be in seconds.
	 */
	accessTokenTTL?: number;
}

/**
 * Error callback function type
 */
export type OAuthErrorCallback = (error: { code: string; description: string; status: number; headers: Record<string, string> }) => Response | void;

/**
 * Token exchange callback function type
 */
export type TokenExchangeCallback = (options: TokenExchangeCallbackOptions) => Promise<TokenExchangeCallbackResult | void> | TokenExchangeCallbackResult | void;

export const clientInfo = z4.object({
	/**
	 * Unique identifier for the client
	 */
	clientId: z4.string().nonempty().trim(),
	/**
	 * Secret used to authenticate the client (stored as a hash)
	 * Only present for confidential clients; undefined for public clients.
	 */
	clientSecret: z4.string().trim().optional(),
	/**
	 * List of allowed redirect URIs for the client
	 */
	redirectUris: z4.array(z4.url()),
	/**
	 * Human-readable name of the client application
	 */
	clientName: z4.string().nonempty().trim().optional(),
	/**
	 * URL to the client's logo
	 */
	logoUri: z4.url().optional(),
	/**
	 * URL to the client's homepage
	 */
	clientUri: z4.url().optional(),
	/**
	 * URL to the client's privacy policy
	 */
	policyUri: z4.url().optional(),
	/**
	 * URL to the client's terms of service
	 */
	tosUri: z4.url().optional(),
	/**
	 * URL to the client's JSON Web Key Set for validating signatures
	 */
	jwksUri: z4.url().optional(),
	/**
	 * List of email addresses for contacting the client developers
	 */
	contacts: z4.array(z4.string().nonempty().trim()).optional(),
	/**
	 * List of grant types the client supports
	 */
	grantTypes: z4.array(z4.string().nonempty().trim()).optional(),
	/**
	 * List of response types the client supports
	 */
	responseTypes: z4.array(z4.string().nonempty().trim()).optional(),
	/**
	 * Unix timestamp when the client was registered
	 */
	registrationDate: z4.coerce.number().int().nonnegative().optional(),
	/**
	 * The authentication method used by the client at the token endpoint.
	 * Values include:
	 * - 'client_secret_basic': Uses HTTP Basic Auth with client ID and secret (default for confidential clients)
	 * - 'client_secret_post': Uses POST parameters for client authentication
	 * - 'none': Used for public clients that can't securely store secrets (SPAs, mobile apps, etc.)
	 */
	tokenEndpointAuthMethod: z4.enum(['client_secret_basic', 'client_secret_post', 'none']),
});

/**
 * Parsed OAuth authorization request parameters
 */
export interface AuthRequest {
	/**
	 * OAuth response type (e.g., "code" for authorization code flow)
	 */
	responseType: string;

	/**
	 * Client identifier for the OAuth client
	 */
	clientId: string;

	/**
	 * URL to redirect to after authorization
	 */
	redirectUri: string;

	/**
	 * Array of requested permission scopes
	 */
	scope: string[];

	/**
	 * Client state value to be returned in the redirect
	 */
	state: string;

	/**
	 * PKCE code challenge (RFC 7636)
	 */
	codeChallenge?: string;

	/**
	 * PKCE code challenge method (plain or S256)
	 */
	codeChallengeMethod?: string;
}

/**
 * Options for completing an authorization request
 */
export interface CompleteAuthorizationOptions {
	/**
	 * The original parsed authorization request
	 */
	request: AuthRequest;

	/**
	 * Identifier for the user granting the authorization
	 */
	userId: string;

	/**
	 * Application-specific metadata to associate with this grant
	 */
	metadata: Record<string, unknown>;

	/**
	 * List of scopes that were actually granted (may differ from requested scopes)
	 */
	scope: string[];

	/**
	 * Application-specific properties to include with API requests
	 * authorized by this grant
	 */
	props: Record<string, unknown>;
}

/**
 * Authorization grant record
 */
export interface Grant {
	/**
	 * Unique identifier for the grant
	 */
	id: string;

	/**
	 * Client that received this grant
	 */
	clientId: string;

	/**
	 * User who authorized this grant
	 */
	userId: string;

	/**
	 * List of scopes that were granted
	 */
	scope: string[];

	/**
	 * Application-specific metadata associated with this grant
	 */
	metadata: Record<string, unknown>;

	/**
	 * Encrypted application-specific properties
	 */
	encryptedProps: string;

	/**
	 * Unix timestamp when the grant was created
	 */
	createdAt: number;

	/**
	 * The hash of the current refresh token associated with this grant
	 */
	refreshTokenId?: string;

	/**
	 * Wrapped encryption key for the current refresh token
	 */
	refreshTokenWrappedKey?: string;

	/**
	 * The hash of the previous refresh token associated with this grant
	 * This token is still valid until the new token is first used
	 */
	previousRefreshTokenId?: string;

	/**
	 * Wrapped encryption key for the previous refresh token
	 */
	previousRefreshTokenWrappedKey?: string;

	/**
	 * The hash of the authorization code associated with this grant
	 * Only present during the authorization code exchange process
	 */
	authCodeId?: string;

	/**
	 * Wrapped encryption key for the authorization code
	 * Only present during the authorization code exchange process
	 */
	authCodeWrappedKey?: string;

	/**
	 * PKCE code challenge for this authorization
	 * Only present during the authorization code exchange process
	 */
	codeChallenge?: string;

	/**
	 * PKCE code challenge method (plain or S256)
	 * Only present during the authorization code exchange process
	 */
	codeChallengeMethod?: string;
}

/**
 * Token record stored in storage
 */
export const token = z4.object({
	/**
	 * Unique identifier for the token (hash of the actual token)
	 */
	id: z4.string().nonempty(),
	/**
	 * Identifier of the grant this token is associated with
	 */
	grantId: z4.string().nonempty(),
	/**
	 * User ID associated with this token
	 */
	userId: z4.string().nonempty(),
	/**
	 * Unix timestamp when the token was created
	 */
	createdAt: z4.coerce.number().int().nonnegative(),
	/**
	 * Unix timestamp when the token expires
	 */
	expiresAt: z4.coerce.number().int().nonnegative(),
	/**
	 * The encryption key for props, wrapped with this token
	 */
	wrappedEncryptionKey: z4.string().nonempty(),
	/**
	 * Denormalized grant information for faster access
	 */
	grant: z4.object({
		/**
		 * Client that received this grant
		 */
		clientId: z4.string().nonempty(),
		/**
		 * List of scopes that were granted
		 */
		scope: z4.array(z4.string().nonempty()),
		/**
		 * Encrypted application-specific properties
		 */
		encryptedProps: z4.string().nonempty(),
	}),
});

/**
 * Options for listing operations that support pagination
 */
export interface ListOptions {
	/**
	 * Maximum number of items to return (max 1000)
	 */
	limit?: number;

	/**
	 * Cursor for pagination (from a previous listing operation)
	 */
	cursor?: string;
}

/**
 * Result of a listing operation with pagination support
 */
export interface ListResult<T> {
	/**
	 * The list of items
	 */
	items: T[];

	/**
	 * Cursor to get the next page of results, if there are more results
	 */
	cursor?: string;
}

/**
 * Public representation of a grant, with sensitive data removed
 * Used for list operations where the complete grant data isn't needed
 */
export interface GrantSummary {
	/**
	 * Unique identifier for the grant
	 */
	id: string;

	/**
	 * Client that received this grant
	 */
	clientId: string;

	/**
	 * User who authorized this grant
	 */
	userId: string;

	/**
	 * List of scopes that were granted
	 */
	scope: string[];

	/**
	 * Application-specific metadata associated with this grant
	 */
	metadata: Record<string, unknown>;

	/**
	 * Unix timestamp when the grant was created
	 */
	createdAt: number;
}

/**
 * Helper methods for OAuth operations provided to handler functions
 */
export interface OAuthHelpers {
	/**
	 * Parses an OAuth authorization request from the HTTP request
	 * @param request - The HTTP request containing OAuth parameters
	 * @returns The parsed authorization request parameters
	 */
	parseAuthRequest(request: Request): Promise<AuthRequest>;

	/**
	 * Looks up a client by its client ID
	 * @param clientId - The client ID to look up
	 * @returns A Promise resolving to the client info, or null if not found
	 */
	lookupClient(clientId: string): Promise<ClientInfo | null>;

	/**
	 * Completes an authorization request by creating a grant and authorization code
	 * @param options - Options specifying the grant details
	 * @returns A Promise resolving to an object containing the redirect URL
	 */
	completeAuthorization(options: CompleteAuthorizationOptions): Promise<{ redirectTo: string }>;

	/**
	 * Creates a new OAuth client
	 * @param clientInfo - Partial client information to create the client with
	 * @returns A Promise resolving to the created client info
	 */
	createClient(clientInfo: Partial<ClientInfo>): Promise<ClientInfo>;

	/**
	 * Lists all registered OAuth clients with pagination support
	 * @param options - Optional pagination parameters (limit and cursor)
	 * @returns A Promise resolving to the list result with items and optional cursor
	 */
	listClients(options?: ListOptions): Promise<ListResult<ClientInfo>>;

	/**
	 * Updates an existing OAuth client
	 * @param clientId - The ID of the client to update
	 * @param updates - Partial client information with fields to update
	 * @returns A Promise resolving to the updated client info, or null if not found
	 */
	updateClient(clientId: string, updates: Partial<ClientInfo>): Promise<ClientInfo | null>;

	/**
	 * Deletes an OAuth client
	 * @param clientId - The ID of the client to delete
	 * @returns A Promise resolving when the deletion is confirmed.
	 */
	deleteClient(clientId: string): Promise<void>;

	/**
	 * Lists all authorization grants for a specific user with pagination support
	 * Returns a summary of each grant without sensitive information
	 * @param userId - The ID of the user whose grants to list
	 * @param options - Optional pagination parameters (limit and cursor)
	 * @returns A Promise resolving to the list result with grant summaries and optional cursor
	 */
	listUserGrants(userId: string, options?: ListOptions): Promise<ListResult<GrantSummary>>;

	/**
	 * Revokes an authorization grant
	 * @param grantId - The ID of the grant to revoke
	 * @param userId - The ID of the user who owns the grant
	 * @returns A Promise resolving when the revocation is confirmed.
	 */
	revokeGrant(grantId: string, userId: string): Promise<void>;
}

export interface OAuthContext {
	oauth: {
		/**
		 * OAuth helpers for interacting with the OAuth system
		 */
		helpers: OAuthHelpers;

		/**
		 * Authenticated user properties (available in protected routes)
		 */
		user?: {
			userId: string;
			clientId: string;
			scope: string[];
			props: Record<string, unknown>;
		};
	};
}
