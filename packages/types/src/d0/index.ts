import { z } from 'zod';

export type D0Blob = [number, ...number[]];

export const ZodUuid = z.union([
	// PrefixedUuid
	z
		.string()
		.trim()
		.min(38)
		.max(40)
		.regex(new RegExp(/^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i)),
	// utf=8
	z
		.string()
		.trim()
		.uuid()
		.refine((value) => import('validator/es/lib/isUUID').then(({ default: isUUID }) => isUUID(value, 7)).catch(() => import('validator').then(({ default: validator }) => validator.isUUID(value, 7)))),
	// hex
	z
		.string()
		.trim()
		.length(32)
		.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value)))),
	z.string().trim().nonempty().base64(),
	z.string().trim().nonempty().base64url(),
]);
