import type { Buffer } from 'node:buffer';

export * from './tenants/index.js';
export * from './users/index.js';

export type PrefixedUuid = `${'t_' | 'd_' | 'u_'}${UuidExport['utf8']}${'' | '_p'}`;
export interface UuidExport {
	utf8: ReturnType<typeof crypto.randomUUID>;
	hex: string;
	// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
	blob: (typeof Uint8Array)['prototype']['buffer'] | Buffer['buffer'];
}

export type ISODateString = `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;

/**
 * Represents a cron expression string (in UTC time).
 * Supports any format supported by `cron-parser` library @link https://www.npmjs.com/package/cron-parser#supported-format
 */
export type CronString = `${number} ${number} ${number | 'l' | 'L'} ${number} ${number | `${number}l` | `${number}L`}` | `${number} ${number} ${number} ${number | 'l' | 'L'} ${number} ${number | `${number}l` | `${number}L`}`;
