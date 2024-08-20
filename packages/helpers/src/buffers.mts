/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { UndefinedProperties } from '@chainfuse/types';
import type { PrefixedUuid, UuidExport } from '@chainfuse/types/d1';
import { v7 as uuidv7 } from 'uuid';

export class BufferHelpers {
	public static bufferFromHex(hex: UuidExport['hex']): Promise<UuidExport['blob']> {
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

	public static bufferToHex(buffer: UuidExport['blob']): Promise<UuidExport['hex']> {
		return (
			import('node:buffer')
				.then(({ Buffer }) => Buffer.from(buffer).toString('hex'))
				/**
				 * @link https://jsbm.dev/AoXo8dEke1GUg
				 */
				.catch(() => new Uint8Array(buffer).reduce((output, elem) => output + ('0' + elem.toString(16)).slice(-2), ''))
		);
	}

	public static get generateUuid(): Promise<UuidExport> {
		return this.secretBytes(16).then((random) => {
			const uuid = uuidv7({ random }) as UuidExport['utf8'];
			const uuidHex = uuid.replaceAll('-', '');

			return this.bufferFromHex(uuidHex).then((blob) => ({
				utf8: uuid,
				hex: uuidHex,
				blob,
			}));
		});
	}

	private static secretBytes(length: number) {
		return import('node:crypto')
			.then(({ randomBytes }) => randomBytes(length))
			.catch(() => {
				const randomBytes = new Uint8Array(length);
				crypto.getRandomValues(randomBytes);
				return randomBytes;
			});
	}

	public static base16secret(length: number) {
		return this.secretBytes(length).then((bytes) => this.bufferToHex(bytes));
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

	/**
	 * @todo refactor with type guards
	 */
	public static uuidConvert(input: UuidExport['blob']): Promise<UuidExport>;
	public static uuidConvert(prefixedUtf: PrefixedUuid): Promise<UuidExport>;
	public static uuidConvert(input: UuidExport['utf8']): Promise<UuidExport>;
	public static uuidConvert(input: UuidExport['hex']): Promise<UuidExport>;
	public static uuidConvert(input: undefined): Promise<UndefinedProperties<UuidExport>>;
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	public static uuidConvert(input?: UuidExport['blob'] | PrefixedUuid | UuidExport['utf8'] | UuidExport['hex']): Promise<UuidExport | UndefinedProperties<UuidExport>> {
		if (input) {
			if (typeof input === 'string') {
				if (input.includes('-')) {
					let hex = input.replaceAll('-', '');

					if (input.includes('_')) {
						input = input.split('_')[1]!;
						hex = hex.split('_')[1]!;
					}

					return this.bufferFromHex(hex).then((blob) => ({
						utf8: input as UuidExport['utf8'],
						hex,
						blob,
					}));
				} else {
					const hex: UuidExport['hex'] = input;

					return this.bufferFromHex(hex).then((blob) => ({
						utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`,
						hex,
						blob,
					}));
				}
			} else {
				const blob: UuidExport['blob'] = input;

				return this.bufferToHex(blob).then((hex) => ({
					utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`,
					hex,
					blob,
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
