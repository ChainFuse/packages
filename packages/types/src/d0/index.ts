export type D0Blob = [number, ...number[]];

/**
 * @deprecated
 */
const PrefixedUuidRaw3 = await import('zod/v3').then(({ z }) =>
	z
		.string()
		.trim()
		.toLowerCase()
		.min(38)
		.max(40)
		.regex(new RegExp(/^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i)),
);
const PrefixedUuidRaw = await import('zod/v4').then(({ z }) =>
	z
		.string()
		.trim()
		.toLowerCase()
		.min(38)
		.max(40)
		.regex(new RegExp(/^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i)),
);

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
export const ZodUuid3 = await import('zod/v3').then(({ z }) =>
	z.union([
		PrefixedUuidRaw3,
		// utf-8
		z
			.string()
			.trim()
			.toLowerCase()
			.uuid()
			.refine((value) => import('validator/es/lib/isUUID').then(({ default: isUUID }) => isUUID(value, 7)).catch(() => import('validator').then(({ default: validator }) => validator.isUUID(value, 7)))),
		// hex
		z
			.string()
			.trim()
			.toLowerCase()
			.length(32)
			.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value)))),
		z.string().trim().nonempty().base64(),
		z.string().trim().nonempty().base64url(),
	]),
);
export const ZodUuid = await import('zod/v4').then(({ z }) =>
	z.union([
		PrefixedUuidRaw,
		// utf-8
		z.uuidv7().trim().toLowerCase(),
		// hex
		z
			.string()
			.trim()
			.toLowerCase()
			.length(32)
			.refine((value) => import('validator/es/lib/isHexadecimal').then(({ default: isHexadecimal }) => isHexadecimal(value)).catch(() => import('validator').then(({ default: validator }) => validator.isHexadecimal(value)))),
		z.base64().trim().nonempty(),
		z.base64url().trim().nonempty(),
	]),
);
