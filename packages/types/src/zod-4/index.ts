import * as z from 'zod/v4';
import { hexUuid4Regex, hexUuid7Regex, hexUuidRegex, prefixedUuid7Regex, prefixedUuidRegex } from '../zod-mini/index.js';

export type JSON = z.infer<z.ZodJSONSchema>;

export const WorkflowId = z
	.string()
	.trim()
	.max(64)
	/**
	 * @link https://developers.cloudflare.com/workflows/reference/limits/
	 */
	.regex(/^[a-zA-Z0-9_][a-zA-Z0-9-_]*$/);
export const DoId = z.hex().trim().length(64).toLowerCase();

export const ZodCoordinate = z
	.string()
	.trim()
	.min(3)
	.regex(new RegExp(/^-?\d+\.\d+$/i));

export const ZodBlob = z.union([
	// Literal `node:buffer` type
	z.instanceof(Buffer).transform((b) => new Uint8Array(b)),
	// Uint8Array
	z.instanceof(Uint8Array).transform((ui8a) => ui8a as Uint8Array<ArrayBufferLike>),
	// ArrayBuffer
	z
		.union([
			// Each one has to be manually specified
			z.instanceof(ArrayBuffer).transform((ab) => ab as ArrayBufferLike),
			z.instanceof(SharedArrayBuffer).transform((sab) => sab as ArrayBufferLike),
		])
		.transform((abl) => new Uint8Array(abl)),
	// D0Blob
	z.tuple([z.int().min(0).max(255)], z.int().min(0).max(255)).transform((arr) => new Uint8Array(arr)),
]);
export const ZodBlobExport = z.tuple([z.int().min(0).max(255)], z.int().min(0).max(255)).transform((arr) => new Uint8Array(arr));

export const PrefixedUuidRaw = z.string().trim().toLowerCase().min(38).max(40).regex(prefixedUuidRegex);
export const PrefixedUuid7Raw = z.string().trim().toLowerCase().min(38).max(40).regex(prefixedUuid7Regex);

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

export const ZodUuid = z.union([
	PrefixedUuidRaw,
	// utf-8
	z.uuid().trim().toLowerCase(),
	// hex
	z.hex().trim().toLowerCase().length(32).regex(hexUuidRegex),
	z.base64().trim().nonempty(),
	z.base64url().trim().nonempty(),
]);
export const ZodUuid4 = z.union([
	// utf-8
	z.uuidv4().trim().toLowerCase(),
	// hex
	z.hex().trim().toLowerCase().length(32).regex(hexUuid4Regex),
	z.base64().trim().nonempty(),
	z.base64url().trim().nonempty(),
]);
export const ZodUuid7 = z.union([
	PrefixedUuid7Raw,
	// utf-8
	z.uuidv7().trim().toLowerCase(),
	// hex
	z.hex().trim().toLowerCase().length(32).regex(hexUuid7Regex),
	z.base64().trim().nonempty(),
	z.base64url().trim().nonempty(),
]);

export const Zod4FakeUuidExport = z.object({
	utf8: z.uuid().trim().toLowerCase(),
	hex: z.hex().trim().toLowerCase().length(32).regex(hexUuidRegex),
	base64: z.base64().trim().nonempty(),
	base64url: z.base64url().trim().nonempty(),
});

export const ZodSuruId = z.union([
	//
	z.hex().trim().toLowerCase().length(96),
	z.base64().trim().max(64),
	z.base64url().trim().max(64),
]);
