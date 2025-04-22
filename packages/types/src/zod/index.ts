import { z } from 'zod';

/**
 * @link https://zod.dev/?id=json-type
 */
const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Json = z.infer<typeof literalSchema> | { [key: string]: Json } | Json[];
export const jsonSchema: z.ZodType<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]));

export const ZodCoordinate = z
	.string()
	.trim()
	.min(3)
	.regex(new RegExp(/^-?\d+\.\d+$/i));
