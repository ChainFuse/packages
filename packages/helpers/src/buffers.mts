import type { UndefinedProperties } from '@chainfuse/types';
import { UUIDExtract7, UUIDExtract8, type PrefixedUuid, type UuidExport, type UUIDExtract } from '@chainfuse/types/d1';
import { PrefixedUuidRaw } from '@chainfuse/types/zod-mini';
import { v7 as uuidv7 } from 'uuid';
import * as z from 'zod/mini';
import { BufferHelpersInternals } from './bufferInternals.mts';
import { CryptoHelpers } from './crypto.mjs';
import type { Version8Options } from './uuid8.mjs';
import { v8 as uuidv8 } from './uuid8.mjs';

export type UuidExportBlobInput = Buffer | UuidExport['blob'];

export class BufferHelpers {
	public static bigintToBuffer(number: bigint): Promise<ArrayBuffer> {
		const hexString = number.toString(16);
		return this.hexToBuffer(hexString.length % 2 === 0 ? hexString : `0${hexString}`);
	}
	public static bigintToBufferSync(number: bigint): ArrayBuffer {
		const hexString = number.toString(16);
		return this.hexToBufferSync(hexString.length % 2 === 0 ? hexString : `0${hexString}`);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public static async bigintToHex(number: bigint): Promise<string> {
		return number.toString(16).length % 2 === 0 ? number.toString(16) : `0${number.toString(16)}`;
	}
	public static bigintToHexSync(number: bigint): string {
		return number.toString(16).length % 2 === 0 ? number.toString(16) : `0${number.toString(16)}`;
	}

	public static bufferToBigint(buffer: UuidExportBlobInput): Promise<bigint> {
		return this.bufferToHex(buffer).then((hex) => BigInt(`0x${hex}`));
	}
	public static bufferToBigintSync(buffer: UuidExportBlobInput): bigint {
		return BigInt(`0x${this.bufferToHexSync(buffer)}`);
	}

	public static hexToBuffer(hex: UuidExport['hex']): Promise<ArrayBuffer> {
		return BufferHelpersInternals.node_hexToBuffer(hex).catch(() => BufferHelpersInternals.browser_hexToBuffer(hex));
	}
	public static hexToBufferSync(hex: UuidExport['hex']): ArrayBuffer {
		return BufferHelpersInternals.browser_hexToBuffer(hex);
	}

	public static bufferToHex(buffer: UuidExportBlobInput): Promise<string> {
		return BufferHelpersInternals.node_bufferToHex(buffer).catch(() => BufferHelpersInternals.browser_bufferToHex(buffer));
	}
	public static bufferToHexSync(buffer: UuidExportBlobInput): string {
		return BufferHelpersInternals.browser_bufferToHex(buffer);
	}

	public static base64ToBuffer(rawBase64: string) {
		return Promise.any([
			z
				.base64()
				.check(z.trim(), z.minLength(1))
				.parseAsync(rawBase64)
				.then((base64) => BufferHelpersInternals.node_base64ToBuffer(base64, false).catch(() => BufferHelpersInternals.browser_base64ToBuffer(base64))),
			z
				.base64url()
				.check(z.trim(), z.minLength(1))
				.parseAsync(rawBase64)
				.then((base64url) => BufferHelpersInternals.node_base64ToBuffer(base64url, true).catch(() => BufferHelpersInternals.browser_base64UrlToBuffer(base64url))),
		]);
	}
	public static base64ToBufferSync(rawBase64: string) {
		try {
			const base64 = z.base64().check(z.trim(), z.minLength(1)).parse(rawBase64);
			return BufferHelpersInternals.browser_base64ToBuffer(base64);
		} catch {
			const base64url = z.base64url().check(z.trim(), z.minLength(1)).parse(rawBase64);
			return BufferHelpersInternals.browser_base64UrlToBuffer(base64url);
		}
	}

	public static bufferToBase64(buffer: UuidExportBlobInput, urlSafe: boolean) {
		return BufferHelpersInternals.node_bufferToBase64(buffer, urlSafe).catch(() => BufferHelpersInternals.browser_bufferToBase64(buffer, urlSafe));
	}
	public static bufferToBase64Sync(buffer: UuidExportBlobInput, urlSafe: boolean) {
		return BufferHelpersInternals.browser_bufferToBase64(buffer, urlSafe);
	}

	public static v7OptionsBase = z.object({
		/**
		 * RFC "timestamp" field
		 */
		msecs: z.optional(
			z.union([
				z.int().check(z.nonnegative()),
				// Allow converting from Date object
				z.pipe(
					z.date(),
					z.transform((date) => date.getTime()),
				),
			]),
		),
		/**
		 * 32-bit sequence Number between 0 - 0xffffffff. This may be provided to help ensure uniqueness for UUIDs generated within the same millisecond time interval. Default = random value.
		 */
		seq: z.optional(z.int().check(z.minimum(0), z.maximum(0xffffffff))),
	});
	public static generateUuid7(_options?: z.input<Awaited<typeof this.v7OptionsBase>>) {
		return Promise.all([
			//
			this.v7OptionsBase.parseAsync(_options ?? {}),
			CryptoHelpers.secretBytes(16),
		]).then(([options, random]) => {
			const uuid = uuidv7({ msecs: options.msecs, random, seq: options.seq }) as UuidExport['utf8'];
			const uuidHex = uuid.replaceAll('-', '');

			return this.hexToBuffer(uuidHex).then((blob) =>
				Promise.all([this.bufferToBase64(blob, false), this.bufferToBase64(blob, true)]).then(
					([base64, base64url]) =>
						({
							utf8: uuid,
							hex: uuidHex,
							blob,
							base64,
							base64url,
						}) as UuidExport,
				),
			);
		});
	}
	public static generateUuid7Sync(_options?: z.input<Awaited<typeof this.v7OptionsBase>>) {
		const options = this.v7OptionsBase.parse(_options ?? {});

		const random = CryptoHelpers.secretBytesSync(16);
		const uuid = uuidv7({ msecs: options.msecs, random, seq: options.seq }) as UuidExport['utf8'];
		const uuidHex = uuid.replaceAll('-', '');

		const blob = this.hexToBufferSync(uuidHex);
		const base64 = this.bufferToBase64Sync(blob, false);
		const base64url = this.bufferToBase64Sync(blob, true);
		return {
			utf8: uuid,
			hex: uuidHex,
			blob,
			base64,
			base64url,
		} as UuidExport;
	}

	public static generateUuid8(options?: Omit<Version8Options, 'random' | 'rng'>) {
		return Promise.all([import('./uuid8.mjs'), CryptoHelpers.secretBytes(16)]).then(([{ v8: uuidv8 }, random]) => {
			const uuid = uuidv8({
				// @ts-expect-error they're the exact same
				random,
				...options,
			}) as UuidExport['utf8'];
			const uuidHex = uuid.replaceAll('-', '');

			return this.hexToBuffer(uuidHex).then((blob) =>
				Promise.all([this.bufferToBase64(blob, false), this.bufferToBase64(blob, true)]).then(
					([base64, base64url]) =>
						({
							utf8: uuid,
							hex: uuidHex,
							blob,
							base64,
							base64url,
						}) as UuidExport,
				),
			);
		});
	}
	public static generateUuid8Sync(options?: Omit<Version8Options, 'random' | 'rng'>) {
		const random = CryptoHelpers.secretBytesSync(16);
		const uuid = uuidv8({
			// @ts-expect-error they're the exact same
			random,
			...options,
		}) as UuidExport['utf8'];
		const uuidHex = uuid.replaceAll('-', '');

		const blob = this.hexToBufferSync(uuidHex);
		const base64 = this.bufferToBase64Sync(blob, false);
		const base64url = this.bufferToBase64Sync(blob, true);
		return {
			utf8: uuid,
			hex: uuidHex,
			blob,
			base64,
			base64url,
		} as UuidExport;
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
				return Promise.any([
					z
						.pipe(
							z.union([
								z.pipe(
									PrefixedUuidRaw,
									z.transform((prefixedUtf8) => prefixedUtf8.split('_')[1]!),
								),
								z.uuid().check(z.trim(), z.minLength(1), z.toLowerCase()),
							]),
							z.transform((value) => value as UuidExport['utf8']),
						)
						.parseAsync(input)
						.then((utf8) => {
							const hex = utf8.replaceAll('-', '');

							return this.hexToBuffer(hex).then((blob) =>
								Promise.all([this.bufferToBase64(blob, false), this.bufferToBase64(blob, true)]).then(
									([base64, base64url]) =>
										({
											utf8,
											hex,
											blob,
											base64,
											base64url,
										}) satisfies UuidExport,
								),
							);
						}),
					z
						.hex()
						.check(z.trim(), z.toLowerCase(), z.length(32))
						.parseAsync(input)
						.then((hex) =>
							this.hexToBuffer(hex).then((blob) =>
								Promise.all([this.bufferToBase64(blob, false), this.bufferToBase64(blob, true)]).then(
									([base64, base64url]) =>
										({
											utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}` as const,
											hex,
											blob,
											base64,
											base64url,
										}) satisfies UuidExport,
								),
							),
						),
				]).catch(() =>
					Promise.any([
						z
							.base64()
							.check(z.trim(), z.minLength(1))
							.parseAsync(input)
							.then((base64) =>
								this.base64ToBuffer(base64).then((blob) =>
									Promise.all([this.bufferToHex(blob), this.bufferToBase64(blob, true)]).then(
										([hex, base64url]) =>
											({
												utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}` as const,
												hex,
												blob,
												base64,
												base64url,
											}) satisfies UuidExport,
									),
								),
							),
						z
							.base64url()
							.check(z.trim(), z.minLength(1))
							.parseAsync(input)
							.then((base64url) =>
								this.base64ToBuffer(base64url).then((blob) =>
									Promise.all([this.bufferToHex(blob), this.bufferToBase64(blob, false)]).then(
										([hex, base64]) =>
											({
												utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}` as const,
												hex,
												blob,
												base64,
												base64url,
											}) satisfies UuidExport,
									),
								),
							),
					]),
				);
			} else {
				return Promise.all([this.bufferToHex(input), this.bufferToBase64(input, false), this.bufferToBase64(input, true)]).then(
					([hex, base64, base64url]) =>
						({
							utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}` as const,
							hex,
							// @ts-expect-error `ArrayBufferLike` is actually accepted and fine
							blob: new Uint8Array(input).buffer,
							base64,
							base64url,
						}) satisfies UuidExport,
				);
			}
		}

		// eslint-disable-next-line @typescript-eslint/require-await
		return (async () =>
			({
				utf8: undefined,
				hex: undefined,
				blob: undefined,
				base64: undefined,
				base64url: undefined,
			}) satisfies UndefinedProperties<UuidExport>)();
	}
	public static uuidConvertSync(input: undefined): UndefinedProperties<UuidExport>;
	public static uuidConvertSync(prefixedUtf: PrefixedUuid): UuidExport;
	public static uuidConvertSync(input: UuidExport['utf8']): UuidExport;
	public static uuidConvertSync(input: UuidExport['hex']): UuidExport;
	public static uuidConvertSync(input: UuidExportBlobInput): UuidExport;
	public static uuidConvertSync(input: UuidExport['base64']): UuidExport;
	public static uuidConvertSync(input: UuidExport['base64url']): UuidExport;
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	public static uuidConvertSync(input?: PrefixedUuid | UuidExport['utf8'] | UuidExport['hex'] | UuidExportBlobInput): UuidExport | UndefinedProperties<UuidExport> {
		if (input) {
			if (typeof input === 'string') {
				try {
					const utf8 = z
						.pipe(
							z.union([
								z.pipe(
									PrefixedUuidRaw,
									z.transform((prefixedUtf8) => prefixedUtf8.split('_')[1]!),
								),
								z.uuid().check(z.trim(), z.minLength(1), z.toLowerCase()),
							]),
							z.transform((value) => value as UuidExport['utf8']),
						)
						.parse(input);

					const hex = utf8.replaceAll('-', '');

					const blob = this.hexToBufferSync(hex);
					const base64 = this.bufferToBase64Sync(blob, false);
					const base64url = this.bufferToBase64Sync(blob, true);
					return {
						utf8,
						hex,
						blob,
						base64,
						base64url,
					} as UuidExport;
				} catch {
					try {
						const hex = z.hex().check(z.trim(), z.toLowerCase(), z.length(32)).parse(input);

						const blob = this.hexToBufferSync(hex);
						const base64 = this.bufferToBase64Sync(blob, false);
						const base64url = this.bufferToBase64Sync(blob, true);
						return {
							utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}` as const,
							hex,
							blob,
							base64,
							base64url,
						} as UuidExport;
					} catch {
						try {
							const base64 = z.base64().check(z.trim(), z.minLength(1)).parse(input);

							const blob = this.base64ToBufferSync(base64);
							const hex = this.bufferToHexSync(blob);
							const base64url = this.bufferToBase64Sync(blob, true);
							return {
								utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}` as const,
								hex,
								blob,
								base64,
								base64url,
							} as UuidExport;
						} catch {
							const base64url = z.base64url().check(z.trim(), z.minLength(1)).parse(input);

							const blob = this.base64ToBufferSync(base64url);
							const hex = this.bufferToHexSync(blob);
							const base64 = this.bufferToBase64Sync(blob, false);
							return {
								utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}` as const,
								hex,
								blob,
								base64,
								base64url,
							} as UuidExport;
						}
					}
				}
			} else {
				const hex = this.bufferToHexSync(input);
				const base64 = this.bufferToBase64Sync(input, false);
				const base64url = this.bufferToBase64Sync(input, true);
				return {
					utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}` as const,
					hex,
					// @ts-expect-error `ArrayBufferLike` is actually accepted and fine
					blob: new Uint8Array(input).buffer,
					base64,
					base64url,
				} as UuidExport;
			}
		}

		return {
			utf8: undefined,
			hex: undefined,
			blob: undefined,
			base64: undefined,
			base64url: undefined,
		} as UndefinedProperties<UuidExport>;
	}

	public static uuidExtractor(input: undefined): Promise<UUIDExtract>;
	public static uuidExtractor(prefixedUtf: PrefixedUuid): Promise<UUIDExtract>;
	public static uuidExtractor(input: UuidExport['utf8']): Promise<UUIDExtract>;
	public static uuidExtractor(input: UuidExport['hex']): Promise<UUIDExtract>;
	public static uuidExtractor(input: UuidExportBlobInput): Promise<UUIDExtract>;
	public static uuidExtractor(input: UuidExport['base64']): Promise<UUIDExtract>;
	public static uuidExtractor(input: UuidExport['base64url']): Promise<UUIDExtract>;
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	public static uuidExtractor(input?: PrefixedUuid | UuidExport['utf8'] | UuidExport['hex'] | UuidExportBlobInput): Promise<UUIDExtract> {
		return this.uuidConvert(
			// @ts-expect-error it's the same type
			input,
		).then(async ({ utf8, hex: _hex }) =>
			z
				.hex()
				.check(z.length(32))
				.safeParseAsync(_hex)
				.then(async ({ success: hexSuccess, data: hex }) => {
					if (hexSuccess) {
						const [{ success: utf8v7Success }, { success: utf8v8Success }] = await Promise.all([z.uuid({ version: 'v7' }).safeParseAsync(utf8), z.uuid({ version: 'v8' }).safeParseAsync(utf8)]);

						if (utf8v7Success || utf8v8Success) {
							if (utf8v8Success) {
								const suffix_hex = hex.substring(13, 16);
								const suffix_buffer = await BufferHelpers.hexToBuffer(suffix_hex);

								return UUIDExtract8.parseAsync({
									date: Number(BigInt(`0x${hex.substring(0, 12)}`)),
									location: parseInt(hex.slice(17, 19), 16),
									shardType: parseInt(hex.slice(19, 20), 16),
									suffix:
										suffix_hex === '000'
											? undefined
											: {
													hex: suffix_hex,
													base64: await BufferHelpers.bufferToBase64(suffix_buffer, false),
													base64url: await BufferHelpers.bufferToBase64(suffix_buffer, true),
												},
								});
							} else {
								return UUIDExtract7.parseAsync({
									date: Number(BigInt(`0x${hex.substring(0, 12)}`)),
								});
							}
						} else {
							throw new Error('Unsupported UUID version provided');
						}
					} else {
						throw new Error('Invalid UUID provided');
					}
				}),
		);
	}
	public static uuidExtractorSync(input: undefined): UUIDExtract;
	public static uuidExtractorSync(prefixedUtf: PrefixedUuid): UUIDExtract;
	public static uuidExtractorSync(input: UuidExport['utf8']): UUIDExtract;
	public static uuidExtractorSync(input: UuidExport['hex']): UUIDExtract;
	public static uuidExtractorSync(input: UuidExportBlobInput): UUIDExtract;
	public static uuidExtractorSync(input: UuidExport['base64']): UUIDExtract;
	public static uuidExtractorSync(input: UuidExport['base64url']): UUIDExtract;
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	public static uuidExtractorSync(input?: PrefixedUuid | UuidExport['utf8'] | UuidExport['hex'] | UuidExportBlobInput): UUIDExtract {
		const { utf8, hex: _hex } = this.uuidConvertSync(
			// @ts-expect-error it's the same type
			input,
		);
		const { success: hexSuccess, data: hex } = z.hex().check(z.length(32)).safeParse(_hex);

		if (hexSuccess) {
			const { success: utf8v7Success } = z.uuid({ version: 'v7' }).safeParse(utf8);
			const { success: utf8v8Success } = z.uuid({ version: 'v8' }).safeParse(utf8);

			if (utf8v7Success || utf8v8Success) {
				if (utf8v8Success) {
					const suffix_hex = hex.substring(13, 16);
					const suffix_buffer = BufferHelpers.hexToBufferSync(suffix_hex);

					return UUIDExtract8.parse({
						date: Number(BigInt(`0x${hex.substring(0, 12)}`)),
						location: parseInt(hex.slice(17, 19), 16),
						shardType: parseInt(hex.slice(19, 20), 16),
						suffix:
							suffix_hex === '000'
								? undefined
								: {
										hex: suffix_hex,
										base64: BufferHelpers.bufferToBase64Sync(suffix_buffer, false),
										base64url: BufferHelpers.bufferToBase64Sync(suffix_buffer, true),
									},
					});
				} else {
					return UUIDExtract7.parse({
						date: Number(BigInt(`0x${hex.substring(0, 12)}`)),
					});
				}
			} else {
				throw new Error('Unsupported UUID version provided');
			}
		} else {
			throw new Error('Invalid UUID provided');
		}
	}
}
