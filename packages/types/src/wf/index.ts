import { z } from 'zod';

export const ZodUuidExportInput = z.union([
	// PrefixedUuid
	z
		.string()
		.trim()
		.min(38)
		.max(40)
		.regex(new RegExp(/^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i)),
	// utf=8
	z.string().trim().nonempty().uuid(),
	// hex
	z
		.string()
		.trim()
		.length(32)
		.refine((values) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(values)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(values)))),
	z.string().trim().nonempty().base64(),
	z.string().trim().nonempty().base64url(),
]);

export const ZodCoordinate = z
	.string()
	.trim()
	.min(3)
	.regex(new RegExp(/^-?\d+\.\d+$/i));
