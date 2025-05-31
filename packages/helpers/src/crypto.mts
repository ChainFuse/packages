import { BufferHelpers } from './buffers.mjs';
import { CryptoHelpersInternals } from './cryptoInternals.mts';

export class CryptoHelpers {
	public static secretBytes(byteSize: number) {
		return CryptoHelpersInternals.node_secretBytes(byteSize).catch(() => CryptoHelpersInternals.browser_secretBytes(byteSize));
	}

	public static base16secret(secretLength: number) {
		return this.secretBytes(secretLength / 2).then((bytes) => BufferHelpers.bufferToHex(bytes.buffer));
	}

	public static base62secret(secretLength: number) {
		const LOWER_CHAR_SET = 'abcdefghijklmnopqrstuvwxyz';
		const NUMBER_CHAR_SET = '0123456789';
		const CHAR_SET = `${NUMBER_CHAR_SET}${LOWER_CHAR_SET}${LOWER_CHAR_SET.toUpperCase()}` as const;

		return this.secretBytes(secretLength).then((randomBytes) => {
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
		return CryptoHelpersInternals.node_getHash(algorithm, input).catch(() => CryptoHelpersInternals.browser_getHash(algorithm, input));
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
