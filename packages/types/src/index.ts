export * from './ai-tools/index.js';
export * from './d0/index.js';
export * from './d1/index.js';
export * from './discourse/index.js';

export type EnumOrEnumLike<T> = T extends Record<string, infer V> ? V : T extends Readonly<Record<string, infer V>> ? V : never;

type MethodKeys<T> = {
	[P in keyof T]: T[P] extends (...args: any[]) => any ? P : never;
}[keyof T];

export type JsonParsed<T> = Omit<T, MethodKeys<T>>;

/**
 * It is used to carry over the types when using the `Object.values()` method.
 */
export type ObjectValues<T> =
	{
		[K in keyof T]: T[K];
	} extends Record<string, infer U>
		? U[]
		: never;

/**
 * This type is similar to the built-in `Partial<>` type, but it applies recursively to nested objects and arrays.
 * If a property is an array, the elements of the array will also be recursively made optional.
 * If a property is an object, the properties of the object will also be recursively made optional.
 */
export type RecursivePartial<T> = {
	[P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[] : T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

/**
 * Returns the union of keys from a given type.
 */
export type UnionKeys<T> = T extends any ? keyof T : never;

/**
 * Defines a type that excludes specific keys from an object type.
 */
export type BlockKeys<T, K extends readonly string[]> = {
	[P in keyof T as P extends K[number] ? never : P]: T[P];
};

/**
 * For when you have a type to conform `URLSearchParams` to, but all values are strings (as per search params spec)
 */
export type InterfaceToSearchParams<T> = Record<keyof T, string>;

export type PromiseFactory<T> = () => Promise<T>;

export interface ExternallyResolvablePromise<T> {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (reason?: any) => void;
}

/**
 * Mark every property of an object as undefined.
 */
export type UndefinedProperties<T extends object> = {
	[P in keyof T]: undefined;
};

export type CustomLogCallback = (message?: any, ...optionalParams: any[]) => void;
export type CustomLoging = boolean | CustomLogCallback;

/**
 * @link https://developers.cloudflare.com/durable-objects/reference/data-location/#restrict-durable-objects-to-a-jurisdiction
 */
export enum DOLocations {
	'The European Union' = 'eu',
	'FedRAMP-compliant data centers' = 'fedramp',
	'Western North America' = 'wnam',
	'Eastern North America' = 'enam',
	'South America' = 'sam',
	'Western Europe' = 'weur',
	'Eastern Europe' = 'eeur',
	'Asia-Pacific' = 'apac',
	'Oceania' = 'oc',
	'Africa' = 'afr',
	'Middle East' = 'me',
}
