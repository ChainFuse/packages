import { DOJurisdictions, DOLocations } from '@chainfuse/types';
import { D0CombinedLocations, D0Environment, D0ShardType, D0SystemType, D0Version, type D0Blob } from '@chainfuse/types/d0';
import { ZodBlob, ZodBlobExport, type ZodPartial, type ZodSuruId } from '@chainfuse/types/zod-mini';
import * as z from 'zod/mini';
import { BufferHelpers } from './buffers.mts';
import { CryptoHelpers } from './crypto.mts';

export class SuruId {
	public static extractOutputBase = z.object({
		version: z.enum(D0Version),
		date: z.date().check(z.minimum(new Date(0)), z.maximum(new Date(Number(BigInt('0x0fffffffffff'))))),
		systemType: z.enum(D0SystemType),
		shardType: z.enum(D0ShardType),
		// Location
		suffixRandom: z.object({
			hex: z.hex().check(z.trim(), z.toLowerCase(), z.length(11)),
			base64: z.base64().check(z.trim(), z.maxLength(Math.ceil((11 * (4 / 6)) / 4) * 4)),
			base64url: z.base64url().check(z.trim(), z.maxLength(Math.round(11 * (4 / 6)))),
		}),
		environment: z.enum(D0Environment),
		stableRandom: z.object({
			hex: z.hex().check(z.trim(), z.toLowerCase(), z.length(64)),
			base64: z.base64().check(z.trim(), z.maxLength(Math.ceil((64 * (4 / 6)) / 4) * 4)),
			base64url: z.base64url().check(z.trim(), z.maxLength(Math.round(64 * (4 / 6)))),
		}),
	});
	public static extractOutput = z.extend(SuruId.extractOutputBase, {
		locationJurisdiction: z.nullable(z.enum(DOJurisdictions)),
		locationHint: z.nullable(z.enum(DOLocations)),
	});

	public static convertOutput = z.object({
		hex: z.hex().check(z.trim(), z.toLowerCase(), z.length(96)),
		blob: ZodBlobExport,
		base64: z.base64().check(z.trim(), z.maxLength(64)),
		base64url: z.base64url().check(z.trim(), z.maxLength(64)),
	});

	public static createInputBase = z.object({
		...this.extractOutputBase.def.shape,
		version: z._default(this.extractOutputBase.def.shape.version, D0Version.v1),
		date: z._default(this.extractOutputBase.def.shape.date, () => new Date()),
		// systemType
		shardType: z._default(this.extractOutputBase.def.shape.shardType, D0ShardType.None),
		// Location
		suffixRandom: z._default(ZodBlob, () => CryptoHelpers.secretBytesSync(Math.ceil(44 / 8))).check(z.refine((b) => b.byteLength === Math.ceil(44 / 8))),
		// environment
		stableRandom: z._default(ZodBlob, () => CryptoHelpers.secretBytesSync(256 / 8)).check(z.refine((b) => b.byteLength === 256 / 8)),
	});
	public static createInput = z.union([
		z.extend(SuruId.createInputBase, {
			locationJurisdiction: z._default(z.nullable(z.enum(DOJurisdictions)), null),
			locationHint: z._default(z.null(), null),
		}),
		z.extend(SuruId.createInputBase, {
			locationJurisdiction: z._default(z.null(), null),
			locationHint: z._default(z.nullable(z.enum(DOLocations)), null),
		}),
	]);
	public static suruCreate(_input: z.input<typeof this.createInput>): Promise<z.output<typeof this.convertOutput>> {
		return SuruId.createInput.parseAsync(_input).then(async (input) => {
			// Pack fields into hex
			let hex = '';

			// Version (4 bytes)
			hex += Number(input.version).toString(16);

			// Timestamp (11 bytes, pad to 12 chars, mask top nibble for version)
			hex += input.date.getTime().toString(16).padStart(12, '0').slice(-11);

			// System Type (3 bytes)
			hex += input.systemType.toString(16).padStart(3, '0').slice(-3);

			// Location (3 bytes)
			hex += (input.locationJurisdiction ? D0CombinedLocations[input.locationJurisdiction] : input.locationHint ? D0CombinedLocations[input.locationHint] : D0CombinedLocations.none).toString(16).padStart(3, '0').slice(-3);

			// Shard Type (2 bytes)
			hex += input.shardType.toString(16).padStart(2, '0').slice(-2);

			// Suffix random (11 bytes)
			hex += (await BufferHelpers.bufferToHex(input.suffixRandom.buffer)).padStart(11, '0').slice(-11);

			// Environment (1 byte)
			hex += input.environment.toString(16).slice(-3);

			// Stable random (32 bytes)
			hex += (await BufferHelpers.bufferToHex(input.stableRandom.buffer)).padStart(64, '0').slice(-64);

			const blob = await BufferHelpers.hexToBuffer(hex);
			const [base64, base64url] = await Promise.all([BufferHelpers.bufferToBase64(blob, false), BufferHelpers.bufferToBase64(blob, true)]);

			return this.convertOutput.parseAsync({
				hex,
				blob: Array.from(new Uint8Array(blob)) as D0Blob,
				base64,
				base64url,
			} satisfies z.input<typeof this.convertOutput>);
		});
	}
	public static suruCreateSync(_input: z.input<typeof this.createInput>): z.output<typeof this.convertOutput> {
		const input = SuruId.createInput.parse(_input);

		// Pack fields into hex
		let hex = '';

		// Version (4 bytes)
		hex += Number(input.version).toString(16);

		// Timestamp (11 bytes, pad to 12 chars, mask top nibble for version)
		hex += input.date.getTime().toString(16).padStart(12, '0').slice(-11);

		// System Type (3 bytes)
		hex += input.systemType.toString(16).padStart(3, '0').slice(-3);

		// Location (3 bytes)
		hex += (input.locationJurisdiction ? D0CombinedLocations[input.locationJurisdiction] : input.locationHint ? D0CombinedLocations[input.locationHint] : D0CombinedLocations.none).toString(16).padStart(3, '0').slice(-3);

		// Shard Type (2 bytes)
		hex += input.shardType.toString(16).padStart(2, '0').slice(-2);

		// Suffix random (11 bytes)
		hex += BufferHelpers.bufferToHexSync(input.suffixRandom.buffer).padStart(11, '0').slice(-11);

		// Environment (1 byte)
		hex += input.environment.toString(16).slice(-3);

		// Stable random (32 bytes)
		hex += BufferHelpers.bufferToHexSync(input.stableRandom.buffer).padStart(64, '0').slice(-64);

		const blob = BufferHelpers.hexToBufferSync(hex);

		return this.convertOutput.parse({
			hex,
			blob: Array.from(new Uint8Array(blob)) as D0Blob,
			base64: BufferHelpers.bufferToBase64Sync(blob, false),
			base64url: BufferHelpers.bufferToBase64Sync(blob, true),
		} satisfies z.input<typeof this.convertOutput>);
	}

	public static suruConvert<O extends typeof this.convertOutput = typeof this.convertOutput>(_input: undefined): Promise<z.output<ZodPartial<O>>>;
	public static suruConvert<I extends z.input<typeof ZodSuruId> = z.input<typeof ZodSuruId>, O extends typeof this.convertOutput = typeof this.convertOutput>(_input: I): Promise<z.output<O>>;
	public static suruConvert<I extends z.input<typeof ZodSuruId> = z.input<typeof ZodSuruId>, O extends typeof this.convertOutput = typeof this.convertOutput>(_input?: I): Promise<z.output<O | ZodPartial<O>>> {
		if (_input) {
			// hex
			return Promise.any([
				SuruId.convertOutput.def.shape.hex.parseAsync(_input).then((hex) =>
					BufferHelpers.hexToBuffer(hex).then((blob) =>
						Promise.all([BufferHelpers.bufferToBase64(blob, false), BufferHelpers.bufferToBase64(blob, true)]).then(
							([base64, base64url]) =>
								this.convertOutput.parseAsync({
									hex,
									blob: Array.from(new Uint8Array(blob)) as D0Blob,
									base64,
									base64url,
								} satisfies z.input<typeof this.convertOutput>) as Promise<z.output<O>>,
						),
					),
				),
				ZodBlob.parseAsync(_input).then((blob) =>
					Promise.all([BufferHelpers.bufferToHex(blob.buffer), BufferHelpers.bufferToBase64(blob.buffer, false), BufferHelpers.bufferToBase64(blob.buffer, true)]).then(
						([hex, base64, base64url]) =>
							this.convertOutput.parseAsync({
								hex,
								blob: Array.from(new Uint8Array(blob)) as D0Blob,
								base64,
								base64url,
							} satisfies z.input<typeof this.convertOutput>) as Promise<z.output<O>>,
					),
				),
			]).catch(() =>
				Promise.any([
					SuruId.convertOutput.def.shape.base64.parseAsync(_input).then((base64) =>
						BufferHelpers.base64ToBuffer(base64).then((blob) =>
							Promise.all([BufferHelpers.bufferToHex(blob), BufferHelpers.bufferToBase64(blob, true)]).then(
								([hex, base64url]) =>
									this.convertOutput.parseAsync({
										hex,
										blob: Array.from(new Uint8Array(blob)) as D0Blob,
										base64,
										base64url,
									} satisfies z.input<typeof this.convertOutput>) as Promise<z.output<O>>,
							),
						),
					),
					SuruId.convertOutput.def.shape.base64url.parseAsync(_input).then((base64url) =>
						BufferHelpers.base64ToBuffer(base64url).then((blob) =>
							Promise.all([BufferHelpers.bufferToHex(blob), BufferHelpers.bufferToBase64(blob, false)]).then(
								([hex, base64]) =>
									this.convertOutput.parseAsync({
										hex,
										blob: Array.from(new Uint8Array(blob)) as D0Blob,
										base64,
										base64url,
									} satisfies z.input<typeof this.convertOutput>) as Promise<z.output<O>>,
							),
						),
					),
				]),
			);
		} else {
			// eslint-disable-next-line @typescript-eslint/require-await
			return (async () =>
				({
					hex: undefined,
					blob: undefined,
					base64: undefined,
					base64url: undefined,
				}) as z.output<ZodPartial<O>>)();
		}
	}
	public static suruConvertSync<O extends typeof this.convertOutput = typeof this.convertOutput>(_input: undefined): z.output<ZodPartial<O>>;
	public static suruConvertSync<I extends z.input<typeof ZodSuruId> = z.input<typeof ZodSuruId>, O extends typeof this.convertOutput = typeof this.convertOutput>(_input: I): z.output<O>;
	public static suruConvertSync<I extends z.input<typeof ZodSuruId> = z.input<typeof ZodSuruId>, O extends typeof this.convertOutput = typeof this.convertOutput>(_input?: I): z.output<O | ZodPartial<O>> {
		if (_input) {
			try {
				const hex = SuruId.convertOutput.def.shape.hex.parse(_input);

				const blob = BufferHelpers.hexToBufferSync(hex);
				const base64 = BufferHelpers.bufferToBase64Sync(blob, false);
				const base64url = BufferHelpers.bufferToBase64Sync(blob, true);

				return this.convertOutput.parse({
					hex,
					blob: Array.from(new Uint8Array(blob)) as D0Blob,
					base64,
					base64url,
				} satisfies z.input<typeof this.convertOutput>) as z.output<O>;
			} catch {
				try {
					const blob = ZodBlob.parse(_input);

					const hex = BufferHelpers.bufferToHexSync(blob.buffer);
					const base64 = BufferHelpers.bufferToBase64Sync(blob.buffer, false);
					const base64url = BufferHelpers.bufferToBase64Sync(blob.buffer, true);

					return this.convertOutput.parse({
						hex,
						blob: Array.from(new Uint8Array(blob)) as D0Blob,
						base64,
						base64url,
					} satisfies z.input<typeof this.convertOutput>) as z.output<O>;
				} catch {
					try {
						const base64 = SuruId.convertOutput.def.shape.base64.parse(_input);

						const blob = BufferHelpers.base64ToBufferSync(base64);
						const hex = BufferHelpers.bufferToHexSync(blob);
						const base64url = BufferHelpers.bufferToBase64Sync(blob, true);

						return this.convertOutput.parse({
							hex,
							blob: Array.from(new Uint8Array(blob)) as D0Blob,
							base64,
							base64url,
						} satisfies z.input<typeof this.convertOutput>) as z.output<O>;
					} catch {
						const base64url = SuruId.convertOutput.def.shape.base64url.parse(_input);

						const blob = BufferHelpers.base64ToBufferSync(base64url);
						const hex = BufferHelpers.bufferToHexSync(blob);
						const base64 = BufferHelpers.bufferToBase64Sync(blob, false);

						return this.convertOutput.parse({
							hex,
							blob: Array.from(new Uint8Array(blob)) as D0Blob,
							base64,
							base64url,
						} satisfies z.input<typeof this.convertOutput>) as z.output<O>;
					}
				}
			}
		} else {
			return {
				hex: undefined,
				blob: undefined,
				base64: undefined,
				base64url: undefined,
			} as z.output<ZodPartial<O>>;
		}
	}

	public static suruExtract<O extends typeof this.extractOutput = typeof this.extractOutput, UO extends z.output<ZodPartial<O>> = z.output<ZodPartial<O>>>(_input: undefined): Promise<UO>;
	public static suruExtract<I extends z.input<typeof ZodSuruId> = z.input<typeof ZodSuruId>, O extends typeof this.extractOutput = typeof this.extractOutput>(_input: I): Promise<z.output<O>>;
	public static suruExtract<I extends z.input<typeof ZodSuruId> = z.input<typeof ZodSuruId>, O extends typeof this.extractOutput = typeof this.extractOutput, UO extends z.output<ZodPartial<O>> = z.output<ZodPartial<O>>>(_input?: I): Promise<z.output<O> | UO> {
		if (_input) {
			return this.suruConvert(_input).then(async ({ hex }) => {
				// Extract fields from hex string (96 chars total)
				let offset = 0;

				// Version (1 char = 4 bits)
				const version = parseInt(hex.slice(offset, offset + 1), 16) as z.output<typeof this.extractOutputBase>['version'];
				offset += 1;

				// Timestamp (11 chars)
				const timestamp = parseInt(hex.slice(offset, offset + 11), 16);
				const date = new Date(timestamp);
				offset += 11;

				// System Type (3 chars)
				const systemType = parseInt(hex.slice(offset, offset + 3), 16) as z.output<typeof this.extractOutputBase>['systemType'];
				offset += 3;

				// Location (3 chars)
				const locationValue = parseInt(hex.slice(offset, offset + 3), 16);
				offset += 3;

				// Find jurisdiction and hint from location value
				let locationJurisdiction: z.output<typeof this.extractOutput>['locationJurisdiction'] = null;
				let locationHint: z.output<typeof this.extractOutput>['locationHint'] = null;

				// Map D0CombinedLocations values to jurisdiction/location enums
				// Find the location key that matches the value
				const locationKey = Object.entries(D0CombinedLocations).find(([, enumValue]) => Number(enumValue) === locationValue)?.[0] as keyof typeof D0CombinedLocations | undefined;

				if (locationKey && locationKey !== 'none') {
					// Check if it's a jurisdiction
					if ((Object.values(DOJurisdictions) as string[]).includes(locationKey)) {
						locationJurisdiction = locationKey as z.output<typeof this.extractOutput>['locationJurisdiction'];
					}

					// Check if it's a location hint
					if ((Object.values(DOLocations) as string[]).includes(locationKey)) {
						locationHint = locationKey as z.output<typeof this.extractOutput>['locationHint'];
					}
				}

				// Shard Type (2 chars)
				const shardType = parseInt(hex.slice(offset, offset + 2), 16) as z.output<typeof this.extractOutputBase>['shardType'];
				offset += 2;

				// Suffix random (11 chars)
				const suffixRandomHex = hex.slice(offset, offset + 11);
				const suffixRandomBuffer = await BufferHelpers.hexToBuffer(suffixRandomHex);
				const [suffixRandomBase64, suffixRandomBase64Url] = await Promise.all([BufferHelpers.bufferToBase64(suffixRandomBuffer, false), BufferHelpers.bufferToBase64(suffixRandomBuffer, true)]);
				offset += 11;

				// Environment (1 char)
				const environment = parseInt(hex.slice(offset, offset + 1), 16) as z.output<typeof this.extractOutputBase>['environment'];
				offset += 1;

				// Stable random (64 chars)
				const stableRandomHex = hex.slice(offset, offset + 64);
				const stableRandomBuffer = await BufferHelpers.hexToBuffer(stableRandomHex);
				const [stableRandomBase64, stableRandomBase64Url] = await Promise.all([BufferHelpers.bufferToBase64(stableRandomBuffer, false), BufferHelpers.bufferToBase64(stableRandomBuffer, true)]);

				return this.extractOutput.parseAsync({
					version,
					date,
					systemType,
					shardType,
					locationJurisdiction,
					locationHint,
					suffixRandom: {
						hex: suffixRandomHex,
						base64: suffixRandomBase64,
						base64url: suffixRandomBase64Url,
					},
					environment,
					stableRandom: {
						hex: stableRandomHex,
						base64: stableRandomBase64,
						base64url: stableRandomBase64Url,
					},
				} satisfies z.input<typeof this.extractOutput>) as Promise<z.output<O>>;
			});
		} else {
			// eslint-disable-next-line @typescript-eslint/require-await
			return (async () =>
				({
					version: undefined,
					date: undefined,
					systemType: undefined,
					shardType: undefined,
					locationJurisdiction: undefined,
					locationHint: undefined,
					suffixRandom: undefined,
					environment: undefined,
					stableRandom: undefined,
				}) as UO)();
		}
	}
	public static suruExtractSync<O extends typeof this.extractOutput = typeof this.extractOutput, UO extends z.output<ZodPartial<O>> = z.output<ZodPartial<O>>>(_input: undefined): UO;
	public static suruExtractSync<I extends z.input<typeof ZodSuruId> = z.input<typeof ZodSuruId>, O extends typeof this.extractOutput = typeof this.extractOutput>(_input: I): z.output<O>;
	public static suruExtractSync<I extends z.input<typeof ZodSuruId> = z.input<typeof ZodSuruId>, O extends typeof this.extractOutput = typeof this.extractOutput, UO extends z.output<ZodPartial<O>> = z.output<ZodPartial<O>>>(_input?: I): z.output<O> | UO {
		if (_input) {
			const { hex } = this.suruConvertSync(_input);

			// Extract fields from hex string (96 chars total)
			let offset = 0;

			// Version (1 char = 4 bits)
			const version = parseInt(hex.slice(offset, offset + 1), 16) as z.output<typeof this.extractOutputBase>['version'];
			offset += 1;

			// Timestamp (11 chars)
			const timestamp = parseInt(hex.slice(offset, offset + 11), 16);
			const date = new Date(timestamp);
			offset += 11;

			// System Type (3 chars)
			const systemType = parseInt(hex.slice(offset, offset + 3), 16) as z.output<typeof this.extractOutputBase>['systemType'];
			offset += 3;

			// Location (3 chars)
			const locationValue = parseInt(hex.slice(offset, offset + 3), 16);
			offset += 3;

			// Find jurisdiction and hint from location value
			let locationJurisdiction: z.output<typeof this.extractOutput>['locationJurisdiction'] = null;
			let locationHint: z.output<typeof this.extractOutput>['locationHint'] = null;

			// Map D0CombinedLocations values to jurisdiction/location enums
			// Find the location key that matches the value
			const locationKey = Object.entries(D0CombinedLocations).find(([, enumValue]) => Number(enumValue) === locationValue)?.[0] as keyof typeof D0CombinedLocations | undefined;

			if (locationKey && locationKey !== 'none') {
				// Check if it's a jurisdiction
				if ((Object.values(DOJurisdictions) as string[]).includes(locationKey)) {
					locationJurisdiction = locationKey as z.output<typeof this.extractOutput>['locationJurisdiction'];
				}

				// Check if it's a location hint
				if ((Object.values(DOLocations) as string[]).includes(locationKey)) {
					locationHint = locationKey as z.output<typeof this.extractOutput>['locationHint'];
				}
			}

			// Shard Type (2 chars)
			const shardType = parseInt(hex.slice(offset, offset + 2), 16) as z.output<typeof this.extractOutputBase>['shardType'];
			offset += 2;

			// Suffix random (11 chars)
			const suffixRandomHex = hex.slice(offset, offset + 11);
			const suffixRandomBuffer = BufferHelpers.hexToBufferSync(suffixRandomHex);
			const suffixRandomBase64 = BufferHelpers.bufferToBase64Sync(suffixRandomBuffer, false);
			const suffixRandomBase64Url = BufferHelpers.bufferToBase64Sync(suffixRandomBuffer, true);
			offset += 11;

			// Environment (1 char)
			const environment = parseInt(hex.slice(offset, offset + 1), 16) as z.output<typeof this.extractOutputBase>['environment'];
			offset += 1;

			// Stable random (64 chars)
			const stableRandomHex = hex.slice(offset, offset + 64);
			const stableRandomBuffer = BufferHelpers.hexToBufferSync(stableRandomHex);
			const stableRandomBase64 = BufferHelpers.bufferToBase64Sync(stableRandomBuffer, false);
			const stableRandomBase64Url = BufferHelpers.bufferToBase64Sync(stableRandomBuffer, true);

			return this.extractOutput.parse({
				version,
				date,
				systemType,
				shardType,
				locationJurisdiction,
				locationHint,
				suffixRandom: {
					hex: suffixRandomHex,
					base64: suffixRandomBase64,
					base64url: suffixRandomBase64Url,
				},
				environment,
				stableRandom: {
					hex: stableRandomHex,
					base64: stableRandomBase64,
					base64url: stableRandomBase64Url,
				},
			} satisfies z.input<typeof this.extractOutput>) as z.output<O>;
		} else {
			return {
				version: undefined,
				date: undefined,
				systemType: undefined,
				shardType: undefined,
				locationJurisdiction: undefined,
				locationHint: undefined,
				suffixRandom: undefined,
				environment: undefined,
				stableRandom: undefined,
			} as UO;
		}
	}
}
