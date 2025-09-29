import { Buffer } from 'node:buffer';
import * as z4 from 'zod/v4';
import { hexUuid4Regex, hexUuid7Regex, hexUuidRegex, prefixedUuid7Regex, prefixedUuidRegex } from '../zod-mini/index.js';

export type JSON = z4.infer<z4.ZodJSONSchema>;

export const WorkflowId = z4
	.string()
	.trim()
	.max(64)
	/**
	 * @link https://developers.cloudflare.com/workflows/reference/limits/
	 */
	.regex(/^[a-zA-Z0-9_][a-zA-Z0-9-_]*$/);
export const DoId = z4.hex().trim().length(64).toLowerCase();

export const ZodCoordinate = z4
	.string()
	.trim()
	.min(3)
	.regex(new RegExp(/^-?\d+\.\d+$/i));

export const ZodBlob = z4.union([
	// Literal `node:buffer` type
	z4.instanceof(Buffer).transform((b) => new Uint8Array(b)),
	// Uint8Array
	z4.instanceof(Uint8Array).transform((ui8a) => ui8a as Uint8Array<ArrayBufferLike>),
	// ArrayBuffer
	z4
		.union([
			// Each one has to be manually specified
			z4.instanceof(ArrayBuffer).transform((ab) => ab as ArrayBufferLike),
			z4.instanceof(SharedArrayBuffer).transform((sab) => sab as ArrayBufferLike),
		])
		.transform((abl) => new Uint8Array(abl)),
	// D0Blob
	z4.tuple([z4.int().min(0).max(255)], z4.int().min(0).max(255)).transform((arr) => new Uint8Array(arr)),
]);
export const ZodBlobExport = z4.tuple([z4.int().min(0).max(255)], z4.int().min(0).max(255)).transform((arr) => new Uint8Array(arr));

export const PrefixedUuidRaw = z4.string().trim().toLowerCase().min(38).max(40).regex(prefixedUuidRegex);
export const PrefixedUuid7Raw = z4.string().trim().toLowerCase().min(38).max(40).regex(prefixedUuid7Regex);

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

export const ZodUuid = z4.union([
	PrefixedUuidRaw,
	// utf-8
	z4.uuid().trim().toLowerCase(),
	// hex
	z4.hex().trim().toLowerCase().length(32).regex(hexUuidRegex),
	z4.base64().trim().nonempty(),
	z4.base64url().trim().nonempty(),
]);
export const ZodUuid4 = z4.union([
	// utf-8
	z4.uuidv4().trim().toLowerCase(),
	// hex
	z4.hex().trim().toLowerCase().length(32).regex(hexUuid4Regex),
	z4.base64().trim().nonempty(),
	z4.base64url().trim().nonempty(),
]);
export const ZodUuid7 = z4.union([
	PrefixedUuid7Raw,
	// utf-8
	z4.uuidv7().trim().toLowerCase(),
	// hex
	z4.hex().trim().toLowerCase().length(32).regex(hexUuid7Regex),
	z4.base64().trim().nonempty(),
	z4.base64url().trim().nonempty(),
]);

export const Zod4FakeUuidExport = z4.object({
	utf8: z4.uuid().trim().toLowerCase(),
	hex: z4.hex().trim().toLowerCase().length(32).regex(hexUuidRegex),
	base64: z4.base64().trim().nonempty(),
	base64url: z4.base64url().trim().nonempty(),
});

export const ZodSuruId = z4.union([
	//
	z4.hex().trim().toLowerCase().length(96),
	z4.base64().trim().max(64),
	z4.base64url().trim().max(64),
]);
