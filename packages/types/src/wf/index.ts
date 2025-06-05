import { z as z3 } from 'zod/v3';
import { z as z4 } from 'zod/v4';

/**
 * @deprecated
 */
export const ZodUuidExportInput3 = z3.union([
	// PrefixedUuid
	z3
		.string()
		.trim()
		.min(38)
		.max(40)
		.regex(new RegExp(/^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i)),
	// utf-8
	z3.string().trim().nonempty().uuid(),
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

export const ZodUuidExportInput = z4.union([
	// PrefixedUuid
	z4
		.string()
		.trim()
		.min(38)
		.max(40)
		.regex(new RegExp(/^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i)),
	// utf-8
	z4.uuid().trim().toLowerCase(),
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
