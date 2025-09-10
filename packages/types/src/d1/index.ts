import type { Buffer } from 'node:buffer';
import type { DOCombinedLocations } from '..';
import type { ShardType } from '../d0';

export type PrefixedUuid = `${'t_' | 'd_' | 'u_'}${UuidExport['utf8']}${'' | '_p'}`;
export interface UuidExport {
	utf8: ReturnType<typeof crypto.randomUUID>;
	hex: string;
	// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
	blob: Buffer['buffer'] | (typeof Uint8Array)['prototype']['buffer'];
	base64: string;
	base64url: string;
}

export interface UUIDExtract7 {
	date: Date;
}
export interface UUIDExtract8 {
	date: Date;
	location: DOCombinedLocations;
	shardType: ShardType;
	suffix?: {
		hex: string;
		base64?: string;
		base64url?: string;
	};
}
export type UUIDExtract = UUIDExtract7 | UUIDExtract8;

export type ISODateString = `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;

/**
 * Represents a cron expression string (in UTC time).
 * Supports any format supported by `cron-parser` library @link https://www.npmjs.com/package/cron-parser#supported-format
 */
export type CronString = `${string | number} ${string | number} ${string | number} ${string | number} ${string | number}` | `${string | number} ${string | number} ${string | number} ${string | number} ${string | number} ${string | number}`;
