import { Dispatch, useCallback, useState } from "react";
import { Button, ButtonProps, Classes, Dialog, Tag } from "@blueprintjs/core";

import { ArrayAction, useBool } from "@hooks";

import QueryBox from "../QueryBox";
import { returnSiblingArray } from "../utils";
import { defaultQueryTerm, queries } from "../queries";
import { removeArrayElemAt, updateArrayElemAt } from "../../../../../utils";

import { CustomClasses } from "../../../../../constants";
import { QueryTerm, QueryTermListRecursive, QueryBoxAction } from "../types";
import { AsBoolean } from "Types/helpers";

import "./_index.sass";


function makeValueString({ property, relationship, value }: QueryTerm): string{
	if(value == null){
		return "";
	} else {
		// @ts-ignore TODO: fix typing of value in optional chaining
		return queries[property][relationship].stringify?.(value) || `${value}`;
	}
}

function joinTerm(term: QueryTerm): string{
	const { property, relationship/*, value */ } = term;
	const valueString = makeValueString(term); 
	return [property, relationship, valueString].filter(AsBoolean).join(" ");
}

function makeTermString(term: QueryTerm | QueryTermListRecursive | (QueryTerm | QueryTermListRecursive)[], useOR: boolean, { parentheses = true }: { parentheses?: boolean } = {}): string {
	if (Array.isArray(term)) {
		const output = term
			.map(tm => makeTermString(tm, !useOR))
			.join(useOR ? " or " : " and ");
		return parentheses ? `(${output})` : output;
	} else {
		return joinTerm(term);
	}
}


type AddTermProps = {
	addTerm: (value: QueryTermListRecursive) => void,
	buttonProps?: Partial<ButtonProps>,
	useOR: boolean
};

function AddTerm({ addTerm, buttonProps = {}, useOR }: AddTermProps){
	const [isDialogOpen, { on: openDialog, off: closeDialog }] = useBool(false);
	const [term, setTerm] = useState([defaultQueryTerm]);

	const queryBoxDispatch = useCallback((action) => {
		switch (action.type) {
		case "removeSelf":
			return;
		case "updateSelf":
			return setTerm(action.value);
		default:
			return;
		}
	}, []);

	const addToQuery = useCallback(() => {
		addTerm(term);
		closeDialog();
	}, [addTerm, closeDialog, term]);

	return <>
		<Button className={CustomClasses.TEXT_SMALL} minimal={true} onClick={openDialog} rightIcon="small-plus" small={true} {...buttonProps} />
		<Dialog canEscapeKeyClose={false} className="zr-query-term-dialog" isOpen={isDialogOpen} lazy={true} onClose={closeDialog} >
			<div className={Classes.DIALOG_BODY}>
				<QueryBox dispatch={queryBoxDispatch} isFirstChild={true} isOnlyChild={true} terms={term} useOR={!useOR} />
			</div>
			<div className={Classes.DIALOG_FOOTER}>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					<Button minimal={true} onClick={closeDialog} text="Cancel" />
					<Button intent="primary" minimal={true} onClick={addToQuery} text="OK" />
				</div>
			</div>
		</Dialog>
	</>;
}

type TermAction =
	| { type: "removeSelf" }
	| { type: "updateSelf", value: (QueryTerm | QueryTermListRecursive)[] };

type TermTagProps = {
	dispatch: Dispatch<TermAction>,
	isLast: boolean,
	term: (QueryTerm | QueryTermListRecursive)[],
	useOR: boolean
};

function TermTag({ dispatch, isLast, term, useOR }: TermTagProps){
	const [isDialogOpen, { on: openDialog, off: closeDialog }] = useBool(false);

	const removeSelfCleanly = useCallback(() => {
		closeDialog();
		dispatch({ type: "removeSelf" });
	}, [closeDialog, dispatch]);

	const queryBoxDispatch = useCallback<Dispatch<QueryBoxAction>>((action) => {
		switch (action.type) {
		case "removeSelf":
			removeSelfCleanly();
			break;
		case "updateSelf":
			return dispatch({ type: "updateSelf", value: action.value });
		default:
			return;
		}
	}, [dispatch, removeSelfCleanly]);

	return <>
		<Tag zr-role="filter-tag" interactive={true} minimal={true} onClick={openDialog} onRemove={removeSelfCleanly} >
			{makeTermString(term, !useOR, { parentheses: false })}
		</Tag>
		{!isLast && <span className={CustomClasses.TEXT_AUXILIARY} zr-role="filter-operator">{useOR ? "OR" : "AND"}</span>}
		<Dialog canEscapeKeyClose={false} className="zr-query-term-dialog" isOpen={isDialogOpen} lazy={true} onClose={closeDialog} >
			<div className={Classes.DIALOG_BODY}>
				<QueryBox dispatch={queryBoxDispatch} isFirstChild={true} isOnlyChild={true} terms={term} useOR={!useOR} />
			</div>
			<div className={Classes.DIALOG_FOOTER}>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					<Button minimal={true} onClick={removeSelfCleanly} text="Remove term" />
					<Button intent="primary" minimal={true} onClick={closeDialog} text="OK" />
				</div>
			</div>
		</Dialog>
	</>;
}


type FilterAction =
	| { type: "removeSelf" }
	| { type: "add", value: QueryTermListRecursive }
	| { type: "remove", index: number }
	| { type: "update", index: number, value: QueryTermListRecursive };

type FilterProps = {
	dispatch: Dispatch<FilterAction>,
	filter: QueryTermListRecursive[],
	isOnlyChild: boolean,
	useOR: boolean
};

function Filter({ dispatch, filter, isOnlyChild, useOR }: FilterProps) {
	const addTerm = useCallback((value) => dispatch({ type: "add", value }), [dispatch]);
	const removeSelf = useCallback(() => dispatch({ type: "removeSelf" }), [dispatch]);

	const termDispatch = useCallback((index, action) => {
		switch (action.type) {
		case "updateSelf":
			return dispatch({ type: "update", index, value: action.value });
		case "removeSelf":
			if (filter.length == 1) {
				return dispatch({ type: "removeSelf" });
			} else {
				return dispatch({ type: "remove", index });
			}
		default:
			return;
		}
	}, [dispatch, filter.length]);

	return <>
		<div className="zr-query-filter--elements">
			{filter.map((term, index) => {
				return <TermTag key={index} dispatch={(action) => termDispatch(index, action)} isLast={index == filter.length - 1} term={term} useOR={useOR} />;
			})}
			<AddTerm addTerm={addTerm} buttonProps={{ intent: "primary", text: useOR ? "OR" : "AND" }} useOR={!useOR} />
		</div>
		{!isOnlyChild && <Button className="zr-filter--remove-self" icon="small-cross" minimal={true} onClick={removeSelf} title="Remove query group" />}
	</>;
}


type QueryFilterListProps = {
	dispatch: Dispatch<ArrayAction<QueryTermListRecursive[]>>,
	terms: QueryTermListRecursive[][],
	useOR: boolean
};

function QueryFilterList({ dispatch, terms, useOR }: QueryFilterListProps) {
	const addTerm = useCallback((value) => dispatch({ type: "add", value }), [dispatch]);

	const filterDispatch = useCallback((index, action) => {
		const child = terms[index];

		switch (action.type) {
		case "removeSelf":
			return dispatch({ type: "remove", index });
		case "add":
			return dispatch({ type: "update", index, value: [returnSiblingArray(child, action.value)] });
		case "remove":
			return dispatch({ type: "update", index, value: removeArrayElemAt(child, action.index) });
		case "update":
			return dispatch({ type: "update", index, value: updateArrayElemAt(child, action.index, action.value) });
		default:
			return;			
		}
	}, [dispatch, terms]);

	return <div className="zr-query-filters">
		{terms.map((term, index) => {
			return <div className="zr-query-filter" key={index}>
				{index > 0 && <span zr-role="filter-list-operator">{useOR ? "OR" : "AND"}</span>}
				<Filter dispatch={(action) => filterDispatch(index, action)} isOnlyChild={terms.length == 1} filter={term} useOR={!useOR} />
			</div>;
		})}
		<AddTerm addTerm={addTerm} buttonProps={{ text: terms.length == 0 ? "Set filter" : (useOR ? "OR" : "AND") }} useOR={!useOR} />
	</div>;
}


export default QueryFilterList;
