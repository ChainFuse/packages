export type D0Blob = [number, ...number[]];

export enum D0Version {
	v0 = 0,
}

export enum D0SystemType {
	Dataspace = 0,
	Tenant = 1,
	User = 2,
	Workflow = 3,
}

export enum D0CombinedLocations {
	none = 0,
	eu = 1,
	fedramp = 2,
	wnam = 10,
	enam = 11,
	sam = 12,
	weur = 13,
	eeur = 14,
	apac = 15,
	oc = 16,
	afr = 17,
	me = 18,
}

export enum D0ShardType {
	None = 0,
	Storage = 1,
}

export enum D0Environment {
	Production = 0,
	Preview = 1,
}
