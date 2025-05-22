import { z } from 'zod/v4';

export const ZodUuidExportInput = z.union([
	// PrefixedUuid
	z
		.string()
		.trim()
		.min(38)
		.max(40)
		.regex(new RegExp(/^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i)),
	// utf-8
	z.uuid().trim().toLowerCase(),
	// hex
	z
		.string()
		.trim()
		.toLowerCase()
		.length(32)
		.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value)))),
	z.base64().trim().nonempty().toLowerCase(),
	z.base64url().trim().nonempty().toLowerCase(),
]);
