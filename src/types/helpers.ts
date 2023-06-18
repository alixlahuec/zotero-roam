// https://stackoverflow.com/a/73913774/21032793
export const isFulfilled = <T,>(p: PromiseSettledResult<T>): p is PromiseFulfilledResult<T> => p.status === "fulfilled";

// https://stackoverflow.com/a/47636222/21032793
export const AsBoolean = <T>(x: T | false | null | undefined): x is T => Boolean(x);

// https://stackoverflow.com/a/61132308/21032793
export type DeepPartial<T> = T extends object ? {
	[P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type Maybe<T> = T | undefined;

export type ObjValues<ObjType> = ObjType[keyof ObjType];
