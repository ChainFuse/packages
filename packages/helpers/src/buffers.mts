import type { UndefinedProperties } from '@chainfuse/types';
import type { PrefixedUuid, UuidExport } from '@chainfuse/types/d1';
import { BufferHelpersInternals } from './bufferInternals.mts';
import { CryptoHelpers } from './crypto.mjs';

export type UuidExportBlobInput = Buffer | UuidExport['blob'];

export class BufferHelpers {
	public static bigintToBuffer(number: bigint) {
		const hexString = number.toString(16);
		return this.hexToBuffer(hexString.length % 2 === 0 ? hexString : `0${hexString}`);
	}

	public static bigintToHex(number: bigint) {
		return number.toString(16).length % 2 === 0 ? number.toString(16) : `0${number.toString(16)}`;
	}

	public static bufferToBigint(buffer: UuidExportBlobInput) {
		return this.bufferToHex(buffer).then((hex) => BigInt(`0x${hex}`));
	}

	public static hexToBuffer(hex: UuidExport['hex']) {
		return BufferHelpersInternals.node_hexToBuffer(hex).catch(() => BufferHelpersInternals.browser_hexToBuffer(hex));
	}

	public static bufferToHex(buffer: UuidExportBlobInput) {
		return BufferHelpersInternals.node_bufferToHex(buffer).catch(() => BufferHelpersInternals.browser_bufferToHex(buffer));
	}

	public static base64ToBuffer(rawBase64: string) {
		return import('zod/v4').then(({ z }) =>
			Promise.any([
				z
					.base64()
					.trim()
					.nonempty()
					.parseAsync(rawBase64)
					.then((base64) => BufferHelpersInternals.node_base64ToBuffer(base64, false).catch(() => BufferHelpersInternals.browser_base64ToBuffer(base64))),
				z
					.base64url()
					.trim()
					.nonempty()
					.parseAsync(rawBase64)
					.then((base64url) => BufferHelpersInternals.node_base64ToBuffer(base64url, true).catch(() => BufferHelpersInternals.browser_base64UrlToBuffer(base64url))),
			]),
		);
	}

	public static bufferToBase64(buffer: UuidExportBlobInput, urlSafe: boolean): Promise<string> {
		return BufferHelpersInternals.node_bufferToBase64(buffer, urlSafe).catch(() => BufferHelpersInternals.browser_bufferToBase64(buffer, urlSafe));
	}

	public static get generateUuid(): Promise<UuidExport> {
		return Promise.all([CryptoHelpers.secretBytes(16), import('uuid')]).then(([random, { v7: uuidv7 }]) => {
			const uuid = uuidv7({ random }) as UuidExport['utf8'];
			const uuidHex = uuid.replaceAll('-', '');

			return this.hexToBuffer(uuidHex).then((blob) =>
				Promise.all([this.bufferToBase64(blob, false), this.bufferToBase64(blob, true)]).then(([base64, base64url]) => ({
					utf8: uuid,
					hex: uuidHex,
					blob,
					base64,
					base64url,
				})),
			);
		});
	}

	public static uuidConvert(input: undefined): Promise<UndefinedProperties<UuidExport>>;
	public static uuidConvert(prefixedUtf: PrefixedUuid): Promise<UuidExport>;
	public static uuidConvert(input: UuidExport['utf8']): Promise<UuidExport>;
	public static uuidConvert(input: UuidExport['hex']): Promise<UuidExport>;
	public static uuidConvert(input: UuidExportBlobInput): Promise<UuidExport>;
	public static uuidConvert(input: UuidExport['base64']): Promise<UuidExport>;
	public static uuidConvert(input: UuidExport['base64url']): Promise<UuidExport>;
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	public static uuidConvert(input?: PrefixedUuid | UuidExport['utf8'] | UuidExport['hex'] | UuidExportBlobInput): Promise<UuidExport | UndefinedProperties<UuidExport>> {
		if (input) {
			if (typeof input === 'string') {
				return import('zod/v4').then(({ z }) =>
					Promise.any([
						//
						import('@chainfuse/types/d0').then(({ PrefixedUuidRaw }) =>
							z
								.union([
									//
									PrefixedUuidRaw.transform((prefixedUtf8) => prefixedUtf8.split('_')[1]!),
									z.uuid().trim().nonempty().toLowerCase(),
								])
								.transform((value) => value as UuidExport['utf8'])
								.parseAsync(input)
								.then((utf8) => {
									const hex = utf8.replaceAll('-', '');

									return this.hexToBuffer(hex).then((blob) =>
										Promise.all([this.bufferToBase64(blob, false), this.bufferToBase64(blob, true)]).then(([base64, base64url]) => ({
											utf8,
											hex,
											blob,
											base64,
											base64url,
										})),
									);
								}),
						),
						z
							.string()
							.trim()
							.toLowerCase()
							.length(32)
							.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value))))
							.parseAsync(input)
							.then((hex) =>
								this.hexToBuffer(hex).then((blob) =>
									Promise.all([this.bufferToBase64(blob, false), this.bufferToBase64(blob, true)]).then(([base64, base64url]) => ({
										utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}` as const,
										hex,
										blob,
										base64,
										base64url,
									})),
								),
							),
					]).catch(() =>
						Promise.any([
							z
								.base64()
								.trim()
								.nonempty()
								.parseAsync(input)
								.then((base64) =>
									this.base64ToBuffer(base64).then((blob) =>
										Promise.all([this.bufferToHex(blob), this.bufferToBase64(blob, true)]).then(([hex, base64url]) => ({
											utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}` as const,
											hex,
											blob,
											base64,
											base64url,
										})),
									),
								),
							z
								.base64url()
								.trim()
								.nonempty()
								.parseAsync(input)
								.then((base64url) =>
									this.base64ToBuffer(base64url).then((blob) =>
										Promise.all([this.bufferToHex(blob), this.bufferToBase64(blob, false)]).then(([hex, base64]) => ({
											utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}` as const,
											hex,
											blob,
											base64,
											base64url,
										})),
									),
								),
						]),
					),
				);
			} else {
				return Promise.all([this.bufferToHex(input), this.bufferToBase64(input, false), this.bufferToBase64(input, true)]).then(([hex, base64, base64url]) => ({
					utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}` as const,
					hex,
					// @ts-expect-error `ArrayBufferLike` is actually accepted and fine
					blob: new Uint8Array(input).buffer,
					base64,
					base64url,
				}));
			}
		}

		// eslint-disable-next-line @typescript-eslint/require-await
		return (async () => ({
			utf8: undefined,
			hex: undefined,
			blob: undefined,
			base64: undefined,
			base64url: undefined,
		}))();
	}
}
