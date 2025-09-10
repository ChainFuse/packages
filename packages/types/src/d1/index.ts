import type { Buffer } from 'node:buffer';
import * as z from 'zod/mini';
import { ShardType } from '../d0/index.js';
import { DOCombinedLocations } from '../index.js';

export type PrefixedUuid = `${'t_' | 'd_' | 'u_'}${UuidExport['utf8']}${'' | '_p'}`;
export interface UuidExport {
	utf8: ReturnType<typeof crypto.randomUUID>;
	hex: string;
	// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
	blob: Buffer['buffer'] | (typeof Uint8Array)['prototype']['buffer'];
	base64: string;
	base64url: string;
}

export const UUIDExtract7 = z.object({
	date: z.coerce.date(),
});

export const UUIDExtract8 = z.extend(UUIDExtract7, {
	location: z.enum(DOCombinedLocations),
	shardType: z.enum(ShardType),
	suffix: z.optional(
		z.object({
			hex: z.hex().check(z.length(3)),
			base64: z.base64(),
			base64url: z.base64url(),
		}),
	),
});

export type UUIDExtract = z.output<typeof UUIDExtract7> | z.output<typeof UUIDExtract8>;

export type ISODateString = `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;

/**
 * Represents a cron expression string (in UTC time).
 * Supports any format supported by `cron-parser` library @link https://www.npmjs.com/package/cron-parser#supported-format
 */
export type CronString = `${string | number} ${string | number} ${string | number} ${string | number} ${string | number}` | `${string | number} ${string | number} ${string | number} ${string | number} ${string | number} ${string | number}`;
