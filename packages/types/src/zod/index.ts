import type { output, infer as zInfer, ZodMiniJSONSchema, ZodMiniObject, ZodMiniOptional } from 'zod/mini';
import * as z from 'zod/mini';

export type ZodPick<O extends ZodMiniObject> = Partial<Record<keyof output<O>, boolean>>;
export type ZodPickedKeys<P extends ZodPick<O>, O extends ZodMiniObject> = Extract<{ [K in keyof P]: P[K] extends true ? K : never }[keyof P], keyof output<O>>;

export type ZodPartial<T extends ZodMiniObject> = ZodMiniObject<
	{
		[k in keyof T['shape']]: ZodMiniOptional<T['shape'][k]>;
	},
	T['_zod']['config']
>;

export type JSON = zInfer<ZodMiniJSONSchema>;

export const ZodCoordinate = z.string().check(z.trim(), z.minLength(3), z.regex(new RegExp(/^-?\d+\.\d+$/i)));

const prefixedUuidRegex = /^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i;
const hexUuidRegex = /^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$/i;
const hexUuid4Regex = /^[0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[0-9a-f]{4}[0-9a-f]{12}$/i;
const prefixedUuid7Regex = /^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i;
const hexUuid7Regex = /^[0-9a-f]{8}[0-9a-f]{4}7[0-9a-f]{3}[0-9a-f]{4}[0-9a-f]{12}$/i;
const prefixedUuid8Regex = /^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i;
const hexUuid8Regex = /^[0-9a-f]{8}[0-9a-f]{4}8[0-9a-f]{3}[0-9a-f]{4}[0-9a-f]{12}$/i;

export const PrefixedUuidRaw = z.string().check(z.trim(), z.toLowerCase(), z.minLength(38), z.maxLength(40), z.regex(prefixedUuidRegex));
export const PrefixedUuid7Raw = z.string().check(z.trim(), z.toLowerCase(), z.minLength(38), z.maxLength(40), z.regex(prefixedUuid7Regex));
export const PrefixedUuid8Raw = z.string().check(z.trim(), z.toLowerCase(), z.minLength(38), z.maxLength(40), z.regex(prefixedUuid8Regex));

export const PrefixedUuid = z.pipe(
	PrefixedUuidRaw,
	z.transform((value) => {
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
export const PrefixedUuid7 = z.pipe(
	PrefixedUuid7Raw,
	z.transform((value) => {
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
export const PrefixedUuid8 = z.pipe(
	PrefixedUuid8Raw,
	z.transform((value) => {
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

export const ZodUuid = z.union([
	PrefixedUuidRaw,
	// utf-8
	z.uuid().check(z.trim(), z.toLowerCase()),
	// hex
	z.hex().check(z.trim(), z.toLowerCase(), z.length(32), z.regex(hexUuidRegex)),
	z.base64().check(z.trim(), z.minLength(1)),
	z.base64url().check(z.trim(), z.minLength(1)),
]);
export const ZodUuid4 = z.union([
	// utf-8
	z.uuidv4().check(z.trim(), z.toLowerCase()),
	// hex
	z.hex().check(z.trim(), z.toLowerCase(), z.length(32), z.regex(hexUuid4Regex)),
	z.base64().check(z.trim(), z.minLength(1)),
	z.base64url().check(z.trim(), z.minLength(1)),
]);
export const ZodUuid7 = z.union([
	PrefixedUuid7Raw,
	// utf-8
	z.uuidv7().check(z.trim(), z.toLowerCase()),
	// hex
	z.hex().check(z.trim(), z.toLowerCase(), z.length(32), z.regex(hexUuid7Regex)),
	z.base64().check(z.trim(), z.minLength(1)),
	z.base64url().check(z.trim(), z.minLength(1)),
]);
export const ZodUuid8 = z.union([
	PrefixedUuid8Raw,
	// utf-8
	z.uuid({ version: 'v8' }).check(z.trim(), z.toLowerCase()),
	// hex
	z.hex().check(z.trim(), z.toLowerCase(), z.length(32), z.regex(hexUuid8Regex)),
	z.base64().check(z.trim(), z.minLength(1)),
	z.base64url().check(z.trim(), z.minLength(1)),
]);

export const Zod4FakeUuidExport = z.object({
	utf8: z.uuid().check(z.trim(), z.toLowerCase()),
	hex: z.hex().check(z.trim(), z.toLowerCase(), z.length(32), z.regex(hexUuidRegex)),
	base64: z.base64().check(z.trim(), z.minLength(1)),
	base64url: z.base64url().check(z.trim(), z.minLength(1)),
});
