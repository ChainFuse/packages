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

export namespace SystemWorkflows {
	export enum Director {
		WsCleanup = '17ef9c63af',
	}
	export enum Dataspace {
		MessageRetentionCleanup = 'b5c7239e98',
		SheetRetentionCleanup = 'd995c7a019',
	}
	export enum Tenant {
		InviteCleanup = 'fa7eadd647',
	}
	export enum User {
		SessionCleanup = '72c14c6b05',
		LoginTokenRefresh = '57b147c395',
	}
}
