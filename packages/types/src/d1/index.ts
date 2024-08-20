export type PrefixedUuid = `${'t_' | 'd_' | 'u_'}${UuidExport['utf8']}${'' | '_p'}`;
export interface UuidExport {
	utf8: ReturnType<typeof crypto.randomUUID>;
	hex: string;
	blob: (typeof Uint8Array)['prototype']['buffer'];
}

export type ISODateString = `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;
