// https://stackoverflow.com/a/73913774/21032793
export const isFulfilled = <T,>(p: PromiseSettledResult<T>): p is PromiseFulfilledResult<T> => p.status === "fulfilled";

// https://stackoverflow.com/a/47636222/21032793
export type ExcludesFalse = <T>(x: T | false | null | undefined) => x is T;

export type Maybe<T> = T | undefined;

export type ObjValues<ObjType> = ObjType[keyof ObjType];
