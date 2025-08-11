import { z as z4 } from 'zod';
import { z as z3 } from 'zod/v3';

/**
 * @link https://zod.dev/?id=json-type
 */
const literalSchema = z3.union([z3.string(), z3.number(), z3.boolean(), z3.null()]);
export type JSON = z3.infer<typeof literalSchema> | { [key: string]: JSON } | JSON[];
export const jsonSchema: z3.ZodType<JSON> = z3.lazy(() => z3.union([literalSchema, z3.array(jsonSchema), z3.record(jsonSchema)]));

export const ZodCoordinate = await import('zod/v4').then(({ z }) =>
	z
		.string()
		.trim()
		.min(3)
		.regex(new RegExp(/^-?\d+\.\d+$/i)),
);

const prefixedUuidRegex = /^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i;
const hexUuidRegex = /^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$/i;
const hexUuid4Regex = /^[0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[0-9a-f]{4}[0-9a-f]{12}$/i;
const prefixedUuid7Regex = /^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i;
const hexUuid7Regex = /^[0-9a-f]{8}[0-9a-f]{4}7[0-9a-f]{3}[0-9a-f]{4}[0-9a-f]{12}$/i;

/**
 * @deprecated
 */
export const Prefixed3UuidRaw = z3.string().trim().toLowerCase().min(38).max(40).regex(prefixedUuidRegex);
export const PrefixedUuidRaw = z4.string().trim().toLowerCase().min(38).max(40).regex(prefixedUuidRegex);

/**
 * @deprecated
 */
export const Prefixed3Uuid7Raw = z3.string().trim().toLowerCase().min(38).max(40).regex(prefixedUuid7Regex);
export const PrefixedUuid7Raw = z4.string().trim().toLowerCase().min(38).max(40).regex(prefixedUuid7Regex);

/**
 * @deprecated
 */
export const Prefixed3Uuid = Prefixed3UuidRaw.transform((value) => {
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
});
export const PrefixedUuid = PrefixedUuidRaw.transform((value) => {
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
});

/**
 * @deprecated
 */
export const Prefixed3Uuid7 = Prefixed3Uuid7Raw.transform((value) => {
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
});
export const PrefixedUuid7 = PrefixedUuid7Raw.transform((value) => {
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
});

/**
 * @deprecated
 */
export const Zod3Uuid = z3.union([
	Prefixed3UuidRaw,
	// utf-8
	z3.string().trim().toLowerCase().uuid(),
	// hex
	z3
		.string()
		.trim()
		.toLowerCase()
		.length(32)
		.regex(hexUuidRegex)
		.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value)))),
	z3.string().trim().nonempty().base64(),
	z3.string().trim().nonempty().base64url(),
]);
export const ZodUuid = z4.union([
	PrefixedUuidRaw,
	// utf-8
	z4.uuid().trim().toLowerCase(),
	// hex
	z4
		.string()
		.trim()
		.toLowerCase()
		.length(32)
		.regex(hexUuidRegex)
		.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value)))),
	z4.base64().trim().nonempty(),
	z4.base64url().trim().nonempty(),
]);

/**
 * @deprecated
 */
export const Zod3Uuid4 = z3.union([
	// utf-8
	z3
		.string()
		.trim()
		.toLowerCase()
		.uuid()
		.refine((value) => import('validator/es/lib/isUUID').then(({ default: isUUID }) => isUUID(value, 4)).catch(() => import('validator').then(({ default: validator }) => validator.isUUID(value, 4)))),
	// hex
	z3
		.string()
		.trim()
		.toLowerCase()
		.length(32)
		.regex(hexUuid4Regex)
		.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value)))),
	z3.string().trim().nonempty().base64(),
	z3.string().trim().nonempty().base64url(),
]);
export const ZodUuid4 = z4.union([
	// utf-8
	z4.uuidv4().trim().toLowerCase(),
	// hex
	z4
		.string()
		.trim()
		.toLowerCase()
		.length(32)
		.regex(hexUuid4Regex)
		.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value)))),
	z4.base64().trim().nonempty(),
	z4.base64url().trim().nonempty(),
]);

/**
 * @deprecated
 */
export const Zod3Uuid7 = z3.union([
	Prefixed3Uuid7Raw,
	// utf-8
	z3
		.string()
		.trim()
		.toLowerCase()
		.uuid()
		.refine((value) => import('validator/es/lib/isUUID').then(({ default: isUUID }) => isUUID(value, 7)).catch(() => import('validator').then(({ default: validator }) => validator.isUUID(value, 7)))),
	// hex
	z3
		.string()
		.trim()
		.toLowerCase()
		.length(32)
		.regex(hexUuid7Regex)
		.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value)))),
	z3.string().trim().nonempty().base64(),
	z3.string().trim().nonempty().base64url(),
]);
export const ZodUuid7 = z4.union([
	PrefixedUuid7Raw,
	// utf-8
	z4.uuidv7().trim().toLowerCase(),
	// hex
	z4
		.string()
		.trim()
		.toLowerCase()
		.length(32)
		.regex(hexUuid7Regex)
		.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value)))),
	z4.base64().trim().nonempty(),
	z4.base64url().trim().nonempty(),
]);

/**
 * @deprecated
 */
export const Zod3FakeUuidExport = z3.object({
	utf8: z3.string().trim().toLowerCase().uuid(),
	hex: z3
		.string()
		.trim()
		.toLowerCase()
		.length(32)
		.regex(hexUuidRegex)
		.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value)))),
	base64: z3.string().trim().nonempty().base64(),
	base64url: z3.string().trim().nonempty().base64url(),
});

export const Zod4FakeUuidExport = z4.object({
	utf8: z4.uuid().trim().toLowerCase(),
	hex: z4
		.string()
		.trim()
		.toLowerCase()
		.length(32)
		.regex(hexUuidRegex)
		.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value)))),
	base64: z4.base64().trim().nonempty(),
	base64url: z4.base64url().trim().nonempty(),
});
