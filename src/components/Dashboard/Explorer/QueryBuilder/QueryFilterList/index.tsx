import { useCallback, useMemo, useState } from "react";
import { Button, ButtonProps, Classes, Dialog, Tag } from "@blueprintjs/core";

import QueryBox from "../QueryBox";

import { removeArrayElemAt, returnSiblingArray, updateArrayElemAt } from "../utils";
import { defaultQueryTerm, queries } from "../queries";
import { useBool } from "../../../../../hooks";

import { CustomClasses } from "../../../../../constants";
import { QueryTerm, QueryTermListRecursive } from "../types";
import { AsBoolean } from "Types/helpers";


function makeValueString({ property, relationship, value }: QueryTerm): string{
	if((value) == null){
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

function makeTermString(term: QueryTerm | QueryTermListRecursive, useOR: boolean, { parentheses = true }: { parentheses?: boolean } = {}): string {
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

	const handlers = useMemo(() => {
		return {
			removeSelf: () => {},
			updateSelf: (val) => setTerm(val)
		};
	}, []);

	const addToQuery = useCallback(() => {
		addTerm(term);
		closeDialog();
	}, [addTerm, closeDialog, term]);

	return <>
		<Button className={CustomClasses.TEXT_SMALL} minimal={true} onClick={openDialog} rightIcon="small-plus" small={true} {...buttonProps} />
		<Dialog canEscapeKeyClose={false} className="zr-query-term-dialog" isOpen={isDialogOpen} lazy={true} onClose={closeDialog} >
			<div className={Classes.DIALOG_BODY}>
				<QueryBox handlers={handlers} isFirstChild={true} isOnlyChild={true} terms={term} useOR={!useOR} />
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


type TermTagProps = {
	handlers: {
		removeSelf: () => void,
		updateSelf: (value: QueryTermListRecursive) => void
	},
	isLast: boolean,
	term: QueryTermListRecursive,
	useOR: boolean
};

function TermTag({ handlers, isLast, term, useOR }: TermTagProps){
	const { removeSelf, updateSelf } = handlers;
	const [isDialogOpen, { on: openDialog, off: closeDialog }] = useBool(false);

	const removeSelfCleanly = useCallback(() => {
		closeDialog();
		removeSelf();
	}, [closeDialog, removeSelf]);

	const handlersForDialog = useMemo(() => {
		return {
			removeSelf: () => removeSelfCleanly(),
			updateSelf
		};
	}, [removeSelfCleanly, updateSelf]);

	return <>
		<Tag zr-role="filter-tag" interactive={true} minimal={true} onClick={openDialog} onRemove={removeSelf} >
			{makeTermString(term, !useOR, { parentheses: false })}
		</Tag>
		{!isLast && <span className={CustomClasses.TEXT_AUXILIARY} zr-role="filter-operator">{useOR ? "OR" : "AND"}</span>}
		<Dialog canEscapeKeyClose={false} className="zr-query-term-dialog" isOpen={isDialogOpen} lazy={true} onClose={closeDialog} >
			<div className={Classes.DIALOG_BODY}>
				<QueryBox handlers={handlersForDialog} isFirstChild={true} isOnlyChild={true} terms={term} useOR={!useOR} />
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


type FilterElementsProps = {
	filter: QueryTermListRecursive[],
	handlers: {
		removeTerm: (index: number) => void,
		updateTerm: (index: number, value: QueryTerm[]) => void
	},
	useOR: boolean
};

function FilterElements({ filter, handlers, useOR }: FilterElementsProps){
	const { removeTerm, updateTerm } = handlers;

	const makeHandlersForChild = useCallback((index) => {
		return {
			removeSelf: () => removeTerm(index),
			updateSelf: (value) => updateTerm(index, value)
		};
	}, [removeTerm, updateTerm]);
	
	return <>
		{filter.map((term, index) => {
			const elemHandlers = makeHandlersForChild(index);
			return <TermTag key={index} handlers={elemHandlers} isLast={index == filter.length - 1} term={term} useOR={useOR} />;
		})}
	</>;
}


type FilterProps = {
	filter: QueryTermListRecursive[],
	handlers: {
		removeSelf: () => void,
		addTerm: (value: QueryTermListRecursive) => void,
		removeTerm: (index: number) => void,
		updateTerm: (index: number, value: QueryTermListRecursive) => void
	},
	isOnlyChild: boolean,
	useOR: boolean
};

function Filter({ filter, handlers, isOnlyChild, useOR }: FilterProps){
	const { removeSelf, addTerm, removeTerm, updateTerm } = handlers;

	const handlersForChild = useMemo<FilterElementsProps["handlers"]>(() => {
		return {
			removeTerm: (index) => {
				if(filter.length == 1){
					removeSelf();
				} else {
					removeTerm(index);
				}
			},
			updateTerm
		};
	}, [filter.length, removeSelf, removeTerm, updateTerm]);

	return <>
		<div className="zr-query-filter--elements">
			<FilterElements handlers={handlersForChild} filter={filter} useOR={useOR} />
			<AddTerm addTerm={addTerm} buttonProps={{ intent: "primary", text: useOR ? "OR" : "AND" }} useOR={!useOR} />
		</div>
		{!isOnlyChild && <Button className="zr-filter--remove-self" icon="small-cross" minimal={true} onClick={removeSelf} title="Remove query group" />}
	</>;
}


type QueryFilterListProps = {
	handlers: {
		addTerm,
		removeTerm,
		updateTerm
	},
	terms: QueryTermListRecursive[][],
	useOR: boolean
};

function QueryFilterList({ handlers, terms, useOR }: QueryFilterListProps){
	const { addTerm, removeTerm, updateTerm } = handlers;

	const makeHandlersForChild = useCallback((index) => {
		const child = terms[index];
		return {
			removeSelf: () => removeTerm(index),
			addTerm: (val) => updateTerm(index, returnSiblingArray(child, val)),
			removeTerm: (subindex) => updateTerm(index, removeArrayElemAt(child, subindex)),
			updateTerm: (subindex, value) => updateTerm(index, updateArrayElemAt(child, subindex, value))
		};
	}, [removeTerm, terms, updateTerm]);

	return <div className="zr-query-filters">
		{terms.map((term, index) => {
			const elemHandlers = makeHandlersForChild(index);
			return <div className="zr-query-filter" key={index}>
				{index > 0 && <span zr-role="filter-list-operator">{useOR ? "OR" : "AND"}</span>}
				<Filter handlers={elemHandlers} isOnlyChild={terms.length == 1} filter={term} useOR={!useOR} />
			</div>;
		})}
		<AddTerm addTerm={addTerm} buttonProps={{ text: terms.length == 0 ? "Set filter" : (useOR ? "OR" : "AND") }} useOR={!useOR} />
	</div>;
}


export default QueryFilterList;
