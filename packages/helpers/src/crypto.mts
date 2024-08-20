import { BufferHelpers } from './buffers.mjs';

export class CryptoHelpers {
	public static secretBytes(length: number) {
		return import('node:crypto')
			.then(({ randomBytes }) => randomBytes(length))
			.catch(() => {
				const randomBytes = new Uint8Array(length);
				crypto.getRandomValues(randomBytes);
				return randomBytes;
			});
	}

	public static base16secret(length: number) {
		return this.secretBytes(length).then((bytes) => BufferHelpers.bufferToHex(bytes));
	}

	public static base62secret(length: number) {
		const LOWER_CHAR_SET = 'abcdefghijklmnopqrstuvwxyz';
		const NUMBER_CHAR_SET = '0123456789';
		const CHAR_SET = `${NUMBER_CHAR_SET}${LOWER_CHAR_SET}${LOWER_CHAR_SET.toUpperCase()}` as const;

		return this.secretBytes(length).then((randomBytes) => {
			/**
			 * @link https://jsbm.dev/x1F2ITy7RU8T2
			 */
			let randomText = '';
			for (const byte of randomBytes) {
				// Map each byte to a character in the character set
				const charIndex = byte % CHAR_SET.length;
				randomText += CHAR_SET.charAt(charIndex);
			}
			return randomText;
		});
	}

	public static getHash(algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', input: string | ArrayBufferLike) {
		return import('node:crypto')
			.then(async ({ createHash }) => {
				const hash = createHash(algorithm.replace('-', '').toLowerCase());

				if (typeof input === 'string') {
					hash.update(input);
				} else {
					await import('node:buffer').then(({ Buffer }) => hash.update(Buffer.from(input)));
				}

				return hash.digest('hex');
			})
			.catch(() => crypto.subtle.digest(algorithm, typeof input === 'string' ? new TextEncoder().encode(input) : input).then((hashBuffer) => BufferHelpers.bufferToHex(hashBuffer)));
	}

	/**
	 * @returns Fully formatted (double quote encapsulated) `ETag` header value
	 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag#etag_value
	 */
	public static generateETag(response: Response, algorithm: Parameters<typeof this.getHash>[0] = 'SHA-512') {
		return response
			.clone()
			.arrayBuffer()
			.then((buffer) => this.getHash(algorithm, buffer).then((hex) => `"${hex}"`));
	}
}
