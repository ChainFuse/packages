import type { Buffer } from 'node:buffer';
import * as z from 'zod/mini';

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

export type UUIDExtract = z.output<typeof UUIDExtract7>;

export type ISODateString = `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;

/**
 * Represents a cron expression string (in UTC time).
 * Supports any format supported by `cron-parser` library @link https://www.npmjs.com/package/cron-parser#supported-format
 */
export type CronString = `${string | number} ${string | number} ${string | number} ${string | number} ${string | number}` | `${string | number} ${string | number} ${string | number} ${string | number} ${string | number} ${string | number}`;
