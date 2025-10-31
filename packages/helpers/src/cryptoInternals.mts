import type { Crypto as CfCrypto } from '@cloudflare/workers-types/experimental';
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

	private static async *internal_streamAsyncIterable(stream: ReadableStream<Uint8Array>) {
		const reader = stream.getReader();
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) return;
				yield value;
			}
		} finally {
			reader.releaseLock();
		}
	}

	public static node_getHashStreaming(algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', body: ReadableStream<Uint8Array>) {
		return import('node:crypto').then(async ({ createHash }) => {
			const hash = createHash(algorithm.replace('-', '').toLowerCase());
			for await (const chunk of this.internal_streamAsyncIterable(body)) {
				hash.update(chunk);
			}
			return hash.digest('hex');
		});
	}

	public static async browser_getHashStreaming(algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', body: ReadableStream<Uint8Array>) {
		if ('DigestStream' in crypto) {
			const digestStream = new (crypto as CfCrypto).DigestStream(algorithm);
			await body.pipeTo(digestStream);
			return BufferHelpers.bufferToHex(await digestStream.digest);
		} else {
			throw new Error('`DigestStream` is not available in this environment');
		}
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
