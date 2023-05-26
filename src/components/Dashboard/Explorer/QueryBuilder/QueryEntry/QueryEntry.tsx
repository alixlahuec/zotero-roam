import { useCallback } from "react";
import { Button, Intent, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { Placement } from "@blueprintjs/popover2";

import InputComponent from "../InputComponent";

import { QueryOperator, defaultQueryTerm, queries } from "../queries";
import { returnSiblingArray } from "../utils";

import { CustomClasses } from "../../../../../constants";
import { QueryProperty, QueryTerm } from "../types";


const popoverProps = {
	minimal: true,
	placement: "bottom" as Placement,
	popoverClassName: CustomClasses.POPOVER
};

const propertyPopoverProps = {
	...popoverProps,
	targetProps: {
		title: "Select a property to query"
	}
};

const relationshipPopoverProps = {
	...popoverProps,
	targetProps: {
		title: "Select a relationship to test for the property"
	}
};

function itemRenderer(item, itemProps) {
	const { handleClick/*, modifiers: { active }*/ } = itemProps;

	return <MenuItem key={item} onClick={handleClick} text={item} />;
}


type OwnProps = {
	handlers: {
		removeSelf: () => void,
		updateSelf: (value: QueryTerm | QueryTerm[]) => void
	},
	isFirstChild: boolean,
	isOnlyChild: boolean,
	term: QueryTerm,
	useOR?: boolean
};

function QueryEntry({ handlers, isFirstChild, isOnlyChild, term, useOR = false }: OwnProps){
	const { removeSelf, updateSelf } = handlers;
	const { property, relationship, value = "" } = term;

	const addSiblingTerm = useCallback(() => {
		updateSelf(returnSiblingArray(term, defaultQueryTerm));
	}, [term, updateSelf]);

	const handlePropChange = useCallback((update) => updateSelf({ ...term, ...update }), [term, updateSelf]);

	const handlePropertyChange = useCallback((newProp: QueryProperty) => {
		const updates: Partial<QueryTerm> = { property: newProp };
		const newOperatorList = queries[newProp] as typeof queries[keyof typeof queries];
		// Update relationship also, if necessary
		if(!(relationship in newOperatorList)){ updates.relationship = Object.keys(newOperatorList)[0]; }
		// Update value also, if necessary
		if (updates.relationship) {
			const newOperator = newOperatorList[updates.relationship] as QueryOperator;
			if (!newOperator.checkInput(value)) { updates.value = newOperator.defaultInput; }
		}

		handlePropChange(updates);
	}, [handlePropChange, relationship, value]);

	const handleRelationshipChange = useCallback((newRel: string) => {
		const updates: Partial<QueryTerm> = { relationship: newRel };
		const newOperator = queries[property][newRel] as QueryOperator;
		// Update value also, if necessary
		if(!newOperator.checkInput(value)) { updates.value = newOperator.defaultInput; }

		handlePropChange(updates);
	}, [handlePropChange, property, value]);
	const handleValueChange = useCallback((val) => handlePropChange({ value: val }), [handlePropChange]);

	return <div className="zr-query-entry">
		{!isFirstChild && <span zr-role="query-entry-operator">{useOR ? "AND" : "OR"}</span>}
		<div>
			<Select 
				filterable={false} 
				itemRenderer={itemRenderer}
				items={Object.keys(queries)}
				onItemSelect={handlePropertyChange}
				popoverProps={propertyPopoverProps} >
				<Button minimal={true} rightIcon="caret-down" text={property} />
			</Select>
			<Select 
				filterable={false} 
				itemRenderer={itemRenderer}
				items={Object.keys(queries[property])}
				onItemSelect={handleRelationshipChange}
				popoverProps={relationshipPopoverProps} >
				<Button minimal={true} rightIcon="caret-down" text={relationship} />
			</Select>
			<InputComponent inputType={queries[property][relationship].inputType} value={value} setValue={handleValueChange} />
		</div>
		{isOnlyChild
			? null
			: <div>
				<Button className={["zr-query-entry--add-sibling", CustomClasses.TEXT_SMALL].join(" ")} 
					icon="small-plus" 
					minimal={true} 
					onClick={addSiblingTerm} 
					small={true} 
					text={(useOR ? "OR" : "AND")} />
				<Button className="zr-query-entry--remove-self" icon={isOnlyChild ? "cross" : "small-cross"} intent={isOnlyChild ? undefined : Intent.DANGER} minimal={true} onClick={removeSelf} title="Remove query term" />
			</div>}
	</div>;
}


export default QueryEntry;
