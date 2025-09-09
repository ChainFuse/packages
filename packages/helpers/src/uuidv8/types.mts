import type { DOCombinedLocations } from '@chainfuse/types';

export interface Version8Options {
	random?: Uint8Array;
	msecs?: number;
	seq?: number;
	rng?: () => Uint8Array;
	region?: DOCombinedLocations;
	suffix?: Uint8Array;
}
