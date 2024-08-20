export * from './d1/index.js';

export type UndefinedProperties<T extends object> = {
	[P in keyof T]: undefined;
};
