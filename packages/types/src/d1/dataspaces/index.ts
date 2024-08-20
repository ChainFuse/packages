export type ObjectValues<T> =
	{
		[K in keyof T]: T[K];
	} extends Record<string, infer U>
		? U[]
		: never;

export type ExtractKeysWithPrefix<T, Prefix extends string> = {
	[K in keyof T]: K extends `${Prefix}${string}` ? K : never;
}[keyof T];
export type FilterKeysWithPrefix<T, Prefix extends string> = {
	[K in keyof T as K extends `${Prefix}${string}` ? K : never]: T[K];
};
export type FilterKeysWithPrefixAndPrepend<T, Prefix extends string, Prepend extends string> = {
	[K in keyof T as K extends `${Prefix}${string}` ? `${Prepend}${K}` : never]: T[K];
};
