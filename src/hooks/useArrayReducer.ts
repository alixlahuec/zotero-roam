import { useReducer } from "react";
import { addElemToArray, removeArrayElemAt, updateArrayElemAt } from "../utils";


export type ArrayAction<T> =
	| { type: "add", value: T }
	| { type: "remove", index: number }
	| { type: "update", index: number, value: T };


function arrayReducer<T>(state: T[], action: ArrayAction<T>) {
	switch (action.type) {
	case "add":
		return addElemToArray(state, action.value);
	case "remove":
		return removeArrayElemAt(state, action.index);
	case "update":
		return updateArrayElemAt(state, action.index, action.value);
	default:
		return state;
	}
}


const useArrayReducer = <T>(initialState: T[], init?: undefined) => useReducer(arrayReducer<T>, initialState, init);


export { useArrayReducer };