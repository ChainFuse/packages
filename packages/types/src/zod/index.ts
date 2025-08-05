import { z } from 'zod/v3';

/**
 * @link https://zod.dev/?id=json-type
 */
const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export type JSON = z.infer<typeof literalSchema> | { [key: string]: JSON } | JSON[];
export const jsonSchema: z.ZodType<JSON> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]));

export const ZodCoordinate = await import('zod/v4').then(({ z }) =>
	z
		.string()
		.trim()
		.min(3)
		.regex(new RegExp(/^-?\d+\.\d+$/i)),
);
