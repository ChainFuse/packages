import type { D1Blob, PrefixedUuid, UndefinedProperties, UuidExport } from '@chainfuse/types';
import { CryptoHelpers } from './crypto.mjs';

export class BufferHelpers {
	/**
	 * @deprecated
	 */
	public static bufferFromHex(...args: Parameters<typeof this.hexToBuffer>): ReturnType<typeof this.hexToBuffer> {
		return this.hexToBuffer(...args);
	}

	public static hexToBuffer(hex: UuidExport['hex']): Promise<UuidExport['blob']> {
		return (
			import('node:buffer')
				.then(({ Buffer }) => {
					const mainBuffer = Buffer.from(hex, 'hex');
					return mainBuffer.buffer.slice(mainBuffer.byteOffset, mainBuffer.byteOffset + mainBuffer.byteLength);
				})
				/**
				 * @link https://jsbm.dev/NHJHj31Zwm3OP
				 */
				.catch(() => new Uint8Array(hex.length / 2).map((_, index) => parseInt(hex.slice(index * 2, index * 2 + 2), 16)).buffer)
		);
	}

	public static bufferToHex(buffer: UuidExport['blob'] | D1Blob): Promise<UuidExport['hex']> {
		return (
			import('node:buffer')
				// @ts-expect-error `ArrayBufferLike` or D1Blob is actually accepted and fine
				.then(({ Buffer }) => Buffer.from(buffer).toString('hex'))
				/**
				 * @link https://jsbm.dev/AoXo8dEke1GUg
				 */
				// @ts-expect-error `ArrayBufferLike` or D1Blob is actually accepted and fine
				.catch(() => new Uint8Array(buffer).reduce((output, elem) => output + ('0' + elem.toString(16)).slice(-2), ''))
		);
	}

	public static base64ToBuffer(rawBase64: string, urlSafe: boolean): Promise<UuidExport['blob']> {
		return import('node:buffer')
			.then(({ Buffer }) => {
				const mainBuffer = Buffer.from(rawBase64, urlSafe ? 'base64url' : 'base64');
				return mainBuffer.buffer.slice(mainBuffer.byteOffset, mainBuffer.byteOffset + mainBuffer.byteLength);
			})
			.catch(() => {
				let base64 = rawBase64;
				if (urlSafe) {
					base64 = rawBase64.replaceAll('-', '+').replaceAll('_', '/');
					// Add padding back to make length a multiple of 4
					while (base64.length % 4 !== 0) {
						base64 += '=';
					}
				}

				return new TextEncoder().encode(atob(base64)).buffer;
			});
	}

	public static bufferToBase64(buffer: UuidExport['blob'] | D1Blob, urlSafe: boolean): Promise<string> {
		return (
			import('node:buffer')
				// @ts-expect-error `ArrayBufferLike` or D1Blob is actually accepted and fine
				.then(({ Buffer }) => Buffer.from(buffer).toString(urlSafe ? 'base64url' : 'base64'))
				.catch(() => {
					// @ts-expect-error `ArrayBufferLike` is actually accepted and fine
					const raw = btoa(new TextDecoder().decode(buffer));
					if (urlSafe) {
						return raw.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
					} else {
						return raw;
					}
				})
		);
	}

	public static get generateUuid(): Promise<UuidExport> {
		return Promise.all([CryptoHelpers.secretBytes(16), import('uuid')]).then(([random, { v7: uuidv7 }]) => {
			const uuid = uuidv7({ random }) as UuidExport['utf8'];
			const uuidHex = uuid.replaceAll('-', '');

			return this.hexToBuffer(uuidHex).then((blob) => ({
				utf8: uuid,
				hex: uuidHex,
				blob,
			}));
		});
	}

	public static uuidConvert(input: undefined): Promise<UndefinedProperties<UuidExport>>;
	public static uuidConvert(prefixedUtf: PrefixedUuid): Promise<UuidExport>;
	public static uuidConvert(input: UuidExport['utf8']): Promise<UuidExport>;
	public static uuidConvert(input: UuidExport['hex']): Promise<UuidExport>;
	public static uuidConvert(input: UuidExport['blob']): Promise<UuidExport>;
	public static uuidConvert(input: D1Blob): Promise<UuidExport>;
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	public static uuidConvert(input?: PrefixedUuid | UuidExport['utf8'] | UuidExport['hex'] | UuidExport['blob'] | D1Blob): Promise<UuidExport | UndefinedProperties<UuidExport>> {
		if (input) {
			if (typeof input === 'string') {
				if (input.includes('-')) {
					let hex = input.replaceAll('-', '');

					if (input.includes('_')) {
						input = input.split('_')[1]!;
						hex = hex.split('_')[1]!;
					}

					return this.hexToBuffer(hex).then((blob) => ({
						utf8: input as UuidExport['utf8'],
						hex,
						blob,
					}));
				} else {
					const hex: UuidExport['hex'] = input;

					return this.hexToBuffer(hex).then((blob) => ({
						utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`,
						hex,
						blob,
					}));
				}
			} else {
				return this.bufferToHex(input).then((hex) => ({
					utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`,
					hex,
					// @ts-expect-error `ArrayBufferLike` or D1Blob is actually accepted and fine
					blob: new Uint8Array(input).buffer,
				}));
			}
		} else {
			// eslint-disable-next-line @typescript-eslint/require-await
			return (async () => ({
				utf8: undefined,
				hex: undefined,
				blob: undefined,
			}))();
		}
	}
}
