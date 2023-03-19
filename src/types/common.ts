// https://stackoverflow.com/a/73913774/21032793
export const isFulfilled = <T,>(p: PromiseSettledResult<T>): p is PromiseFulfilledResult<T> => p.status === "fulfilled";
export type Maybe<T> = T | undefined;
