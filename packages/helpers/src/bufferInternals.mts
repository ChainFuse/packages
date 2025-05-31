import type { UuidExport } from '@chainfuse/types/d1';

export class BufferHelpersInternals {
	public static node_hexToBuffer(hex: UuidExport['hex']): Promise<UuidExport['blob']> {
		return import('node:buffer').then(({ Buffer }) => {
			const mainBuffer = Buffer.from(hex, 'hex');
			return mainBuffer.buffer.slice(mainBuffer.byteOffset, mainBuffer.byteOffset + mainBuffer.byteLength);
		});
	}

	public static node_bufferToHex(buffer: UuidExport['blob']): Promise<UuidExport['hex']> {
		return import('node:buffer').then(({ Buffer }) =>
			// @ts-expect-error `ArrayBufferLike` is actually accepted and fine
			Buffer.from(buffer).toString('hex'),
		);
	}

	public static browser_hexToBuffer(hex: UuidExport['hex']): UuidExport['blob'] {
		/**
		 * @link https://jsbm.dev/NHJHj31Zwm3OP
		 */
		return new Uint8Array(hex.length / 2).map((_, index) => parseInt(hex.slice(index * 2, index * 2 + 2), 16)).buffer;
	}

	public static browser_bufferToHex(buffer: UuidExport['blob']): UuidExport['hex'] {
		/**
		 * @link https://jsbm.dev/AoXo8dEke1GUg
		 */
		// @ts-expect-error `ArrayBufferLike` is actually accepted and fine
		return new Uint8Array(buffer).reduce((output, elem) => output + ('0' + elem.toString(16)).slice(-2), '');
	}

	public static browser_base64UrlToBuffer(base64url: string): UuidExport['blob'] {
		let base64 = base64url.replaceAll('-', '+').replaceAll('_', '/');
		// Add padding back to make length a multiple of 4
		while (base64.length % 4 !== 0) {
			base64 += '=';
		}
		const binaryString = atob(base64);
		const bytes = new Uint8Array(binaryString.length);
		for (const [i, char] of Array.from(binaryString).entries()) {
			bytes[i] = char.charCodeAt(0);
		}
		return bytes.buffer;
	}

	public static node_base64ToBuffer(base64: string, isBase64Url: boolean): Promise<UuidExport['blob']> {
		return import('node:buffer').then(({ Buffer }) => {
			const mainBuffer = Buffer.from(base64, isBase64Url ? 'base64url' : 'base64');
			return mainBuffer.buffer.slice(mainBuffer.byteOffset, mainBuffer.byteOffset + mainBuffer.byteLength);
		});
	}

	public static browser_base64ToBuffer(base64: string): UuidExport['blob'] {
		const binaryString = atob(base64);
		const bytes = new Uint8Array(binaryString.length);
		for (const [i, char] of Array.from(binaryString).entries()) {
			bytes[i] = char.charCodeAt(0);
		}
		return bytes.buffer;
	}

	public static node_bufferToBase64(buffer: UuidExport['blob'], urlSafe: boolean): Promise<string> {
		return import('node:buffer').then(({ Buffer }) =>
			// @ts-expect-error `ArrayBufferLike` is actually accepted and fine
			Buffer.from(buffer).toString(urlSafe ? 'base64url' : 'base64'),
		);
	}

	public static browser_bufferToBase64(buffer: UuidExport['blob'], urlSafe: boolean): string {
		// @ts-expect-error `ArrayBufferLike` is actually accepted and fine
		const bytes = new Uint8Array(buffer);
		let binaryString = '';
		for (const byte of bytes) {
			binaryString += String.fromCharCode(byte);
		}
		const raw = btoa(binaryString);
		if (urlSafe) {
			return raw.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
		} else {
			return raw;
		}
	}
}
