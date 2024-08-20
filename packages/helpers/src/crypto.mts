import { BufferHelpers } from './buffers.mjs';

export class CryptoHelpers {
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
}
