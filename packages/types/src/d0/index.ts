import { z as z3 } from 'zod/v3';
import { z as z4 } from 'zod/v4';

export type D0Blob = [number, ...number[]];

const prefixedUuidRegex = /^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i;

/**
 * @deprecated
 */
const PrefixedUuidRaw3 = z3.string().trim().toLowerCase().min(38).max(40).regex(prefixedUuidRegex);
export const PrefixedUuidRaw = z4.string().trim().toLowerCase().min(38).max(40).regex(prefixedUuidRegex);

/**
 * @deprecated
 */
export const PrefixedUuid3 = PrefixedUuidRaw3.transform((value) => {
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
export const ZodUuid3 = z3.union([
	PrefixedUuidRaw3,
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
		.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value)))),
	z3.string().trim().nonempty().base64(),
	z3.string().trim().nonempty().base64url(),
]);
export const ZodUuid = z4.union([
	PrefixedUuidRaw,
	// utf-8
	z4.uuidv7().trim().toLowerCase(),
	// hex
	z4
		.string()
		.trim()
		.toLowerCase()
		.length(32)
		.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value)))),
	z4.base64().trim().nonempty(),
	z4.base64url().trim().nonempty(),
]);
