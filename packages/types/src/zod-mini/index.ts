import * as zm from 'zod/mini';

export type ZodPick<O extends zm.ZodMiniObject> = Partial<Record<keyof zm.output<O>, boolean>>;
export type ZodPickedKeys<P extends ZodPick<O>, O extends zm.ZodMiniObject> = Extract<{ [K in keyof P]: P[K] extends true ? K : never }[keyof P], keyof zm.output<O>>;

export type ZodPartial<T extends zm.ZodMiniObject> = zm.ZodMiniObject<
	{
		[k in keyof T['shape']]: zm.ZodMiniOptional<T['shape'][k]>;
	},
	T['_zod']['config']
>;

export type JSON = zm.infer<zm.ZodMiniJSONSchema>;

export const WorkflowId = zm.string().check(
	zm.trim(),
	zm.maxLength(64),
	/**
	 * @link https://developers.cloudflare.com/workflows/reference/limits/
	 */
	zm.regex(/^[a-zA-Z0-9_][a-zA-Z0-9-_]*$/),
);
export const DoId = zm.hex().check(zm.trim(), zm.length(64), zm.toLowerCase());

export const ZodCoordinate = zm.string().check(zm.trim(), zm.minLength(3), zm.regex(new RegExp(/^-?\d+\.\d+$/i)));

export const ZodBlob = zm.union([
	// Literal `node:buffer` type
	zm.pipe(
		zm.instanceof(Buffer),
		zm.transform((b) => new Uint8Array(b) as Uint8Array<ArrayBufferLike>),
	),
	// Uint8Array
	zm.pipe(
		zm.instanceof(Uint8Array),
		zm.transform((ui8a) => ui8a as Uint8Array<ArrayBufferLike>),
	),
	// ArrayBuffer
	zm.pipe(
		zm.union([
			// Each one has to be manually specified
			zm.pipe(
				zm.instanceof(ArrayBuffer),
				zm.transform((ab) => ab as ArrayBufferLike),
			),
			zm.pipe(
				zm.instanceof(SharedArrayBuffer),
				zm.transform((sab) => sab as ArrayBufferLike),
			),
		]),
		zm.transform((abl) => new Uint8Array(abl)),
	),
	// D0Blob
	zm.pipe(
		zm.tuple([zm.int().check(zm.minimum(0), zm.maximum(255))], zm.int().check(zm.minimum(0), zm.maximum(255))),
		zm.transform((arr) => new Uint8Array(arr) as Uint8Array<ArrayBufferLike>),
	),
]);
export const ZodBlobExport = zm.tuple([zm.int().check(zm.minimum(0), zm.maximum(255))], zm.int().check(zm.minimum(0), zm.maximum(255)));

export const prefixedUuidRegex = /^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i;
export const hexUuidRegex = /^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$/i;
export const hexUuid4Regex = /^[0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[0-9a-f]{4}[0-9a-f]{12}$/i;
export const prefixedUuid7Regex = /^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i;
export const hexUuid7Regex = /^[0-9a-f]{8}[0-9a-f]{4}7[0-9a-f]{3}[0-9a-f]{4}[0-9a-f]{12}$/i;

export const PrefixedUuidRaw = zm.string().check(zm.trim(), zm.toLowerCase(), zm.minLength(38), zm.maxLength(40), zm.regex(prefixedUuidRegex));
export const PrefixedUuid7Raw = zm.string().check(zm.trim(), zm.toLowerCase(), zm.minLength(38), zm.maxLength(40), zm.regex(prefixedUuid7Regex));

export const PrefixedUuid = zm.pipe(
	PrefixedUuidRaw,
	zm.transform((value) => {
		let type: 'dataspace' | 'tenant' | 'user';
		if (value.startsWith('d_')) {
			type = 'dataspace';
		} else if (value.startsWith('t_')) {
			type = 'tenant';
		} else if (value.startsWith('u_')) {
			type = 'user';
		} else {
			throw new Error('Invalid UUID prefix');
		}

		return { type, value, preview: value.endsWith('_p') };
	}),
);
export const PrefixedUuid7 = zm.pipe(
	PrefixedUuid7Raw,
	zm.transform((value) => {
		let type: 'dataspace' | 'tenant' | 'user';
		if (value.startsWith('d_')) {
			type = 'dataspace';
		} else if (value.startsWith('t_')) {
			type = 'tenant';
		} else if (value.startsWith('u_')) {
			type = 'user';
		} else {
			throw new Error('Invalid UUID prefix');
		}

		return { type, value, preview: value.endsWith('_p') };
	}),
);

export const ZodUuid = zm.union([
	PrefixedUuidRaw,
	// utf-8
	zm.uuid().check(zm.trim(), zm.toLowerCase()),
	// hex
	zm.hex().check(zm.trim(), zm.toLowerCase(), zm.length(32), zm.regex(hexUuidRegex)),
	zm.base64().check(zm.trim(), zm.minLength(1)),
	zm.base64url().check(zm.trim(), zm.minLength(1)),
]);
export const ZodUuid4 = zm.union([
	// utf-8
	zm.uuidv4().check(zm.trim(), zm.toLowerCase()),
	// hex
	zm.hex().check(zm.trim(), zm.toLowerCase(), zm.length(32), zm.regex(hexUuid4Regex)),
	zm.base64().check(zm.trim(), zm.minLength(1)),
	zm.base64url().check(zm.trim(), zm.minLength(1)),
]);
export const ZodUuid7 = zm.union([
	PrefixedUuid7Raw,
	// utf-8
	zm.uuidv7().check(zm.trim(), zm.toLowerCase()),
	// hex
	zm.hex().check(zm.trim(), zm.toLowerCase(), zm.length(32), zm.regex(hexUuid7Regex)),
	zm.base64().check(zm.trim(), zm.minLength(1)),
	zm.base64url().check(zm.trim(), zm.minLength(1)),
]);

export const Zod4FakeUuidExport = zm.object({
	utf8: zm.uuid().check(zm.trim(), zm.toLowerCase()),
	hex: zm.hex().check(zm.trim(), zm.toLowerCase(), zm.length(32), zm.regex(hexUuidRegex)),
	base64: zm.base64().check(zm.trim(), zm.minLength(1)),
	base64url: zm.base64url().check(zm.trim(), zm.minLength(1)),
});

export const ZodSuruId = zm.union([
	//
	zm.hex().check(zm.trim(), zm.toLowerCase(), zm.length(96)),
	ZodBlob,
	zm.base64().check(zm.trim(), zm.maxLength(64)),
	zm.base64url().check(zm.trim(), zm.maxLength(64)),
]);
