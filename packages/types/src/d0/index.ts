export type D0Blob = [number, ...number[]];

export enum D0Version {
	v1 = 0,
}

export enum D0SystemType {
	Dataspace = 1,
	Tenant = 2,
	User = 3,
	Workflow = 4,
}

export enum D0CombinedLocations {
	none = 0,
	eu = 1,
	fedramp = 2,
	'fedramp-high' = 3,
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
	Scheduler = 1,
	Storage = 2,
	MCP = 3,
	EphemeralAgent = 4,
	Session = 5,
}

export enum D0Environment {
	Production = 0,
	Preview = 1,
}
