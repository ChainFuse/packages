import { BufferHelpers } from './buffers.mjs';

export class CryptoHelpersInternals {
	public static node_secretBytes(byteSize: number): Promise<Uint8Array> {
		return import('node:crypto').then(({ randomBytes }) => {
			const mainBuffer = randomBytes(byteSize);
			return new Uint8Array(mainBuffer.buffer.slice(mainBuffer.byteOffset, mainBuffer.byteOffset + mainBuffer.byteLength));
		});
	}

	public static browser_secretBytes(byteSize: number): Uint8Array {
		const randomBytes = new Uint8Array(byteSize);
		crypto.getRandomValues(randomBytes);
		return randomBytes;
	}

	public static node_getHash(algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', input: string | ArrayBufferLike): Promise<string> {
		return import('node:crypto').then(async ({ createHash }) => {
			const hash = createHash(algorithm.replace('-', '').toLowerCase());

			if (typeof input === 'string') {
				hash.update(input);
			} else {
				await import('node:buffer').then(({ Buffer }) => hash.update(Buffer.from(input)));
			}

			return hash.digest('hex');
		});
	}

	public static browser_getHash(algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', input: string | ArrayBufferLike): Promise<string> {
		// @ts-expect-error `ArrayBufferLike` is actually accepted and fine
		return crypto.subtle.digest(algorithm, typeof input === 'string' ? new TextEncoder().encode(input) : input).then((hashBuffer) => BufferHelpers.bufferToHex(hashBuffer));
	}
}
