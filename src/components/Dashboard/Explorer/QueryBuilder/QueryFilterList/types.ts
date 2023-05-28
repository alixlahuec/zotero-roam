import { QueryTerm, QueryTermListRecursive } from "../types";


export type QueryBoxAction =
	| { type: "removeSelf" }
	| { type: "updateSelf", value: (QueryTerm | QueryTermListRecursive)[] };

export type QueryEntryAction =
	| { type: "removeSelf" }
	| { type: "updateSelf", value: QueryTerm | QueryTerm[] };

export type QueryTermAction<T extends QueryTerm | QueryTermListRecursive> =
	| { type: "removeSelf" }
	| { type: "updateSelf", value: T };