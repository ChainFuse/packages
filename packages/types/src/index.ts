export * from './d1/index.js';
export * from './discourse/index.js';

type MethodKeys<T> = {
	[P in keyof T]: T[P] extends (...args: any[]) => any ? P : never;
}[keyof T];

export type JsonParsed<T> = Omit<T, MethodKeys<T>>;

export type RecursivePartial<T> = {
	[P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[] : T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

export type UnionKeys<T> = T extends any ? keyof T : never;

export type BlockKeys<T, K extends readonly string[]> = {
	[P in keyof T as P extends K[number] ? never : P]: T[P];
};

export type PromiseFactory<T> = () => Promise<T>;

export interface ExternallyResolvablePromise<T> {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (reason?: any) => void;
}

export type UndefinedProperties<T extends object> = {
	[P in keyof T]: undefined;
};
