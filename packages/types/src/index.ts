export * from './d1/index.js';

export type UndefinedProperties<T> = {
	[P in keyof T]: undefined;
};
