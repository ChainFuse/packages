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
