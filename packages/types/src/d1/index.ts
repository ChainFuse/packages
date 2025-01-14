import type { Buffer } from 'node:buffer';
import isHexadecimal from 'validator/es/lib/isHexadecimal';
import { z } from 'zod';

export * from './tenants/index.js';
export * from './users/index.js';

export type PrefixedUuid = `${'t_' | 'd_' | 'u_'}${UuidExport['utf8']}${'' | '_p'}`;
export type D1Blob = [number, ...number[]];
export interface UuidExport {
	utf8: ReturnType<typeof crypto.randomUUID>;
	hex: string;
	// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
	blob: (typeof Uint8Array)['prototype']['buffer'] | Buffer['buffer'];
}
export const ZodUuidExportInput = z.union([
	// prefixed utf8
	z
		.string()
		.trim()
		.regex(new RegExp(/^((d|t|u)_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_p)?$/i)),
	// utf8
	z.string().trim().uuid(),
	// hex
	z
		.string()
		.trim()
		.length(32)
		.refine((value) => isHexadecimal(value)),
]);

export type ISODateString = `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;

/**
 * Represents a cron expression string (in UTC time).
 * Supports any format supported by `cron-parser` library @link https://www.npmjs.com/package/cron-parser#supported-format
 */
export type CronString = `${string | number} ${string | number} ${string | number} ${string | number} ${string | number}` | `${string | number} ${string | number} ${string | number} ${string | number} ${string | number} ${string | number}`;
