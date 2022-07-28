import React, { useCallback } from "react";
import { any, bool, func, oneOf, shape, string } from "prop-types";
import { Button, MenuItem } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";

import InputComponent from "./InputComponent";
import { defaultQueryTerm, queries } from "./queries";
import { returnSiblingArray } from "./utils";

import { CustomClasses } from "../../../../constants";

const propertyProps = {
	title: "Select a property to query"
};

const relationshipProps = {
	title: "Select a relationship to test for the property"
};

const popoverProps = {
	minimal: true,
	popoverClassName: CustomClasses.POPOVER
};

function itemRenderer(item, itemProps) {
	const { handleClick/*, modifiers: { active }*/ } = itemProps;

	return <MenuItem key={item} onClick={handleClick} text={item} />;
}

function QueryEntry({ handlers, isFirstChild, isOnlyChild, term, useOR = false }){
	const { removeSelf, updateSelf } = handlers;
	const { property, relationship, value = "" } = term;

	const addSiblingTerm = useCallback(() => {
		updateSelf(returnSiblingArray(term, defaultQueryTerm));
	}, [term, updateSelf]);

	const handlePropChange = useCallback((update) => updateSelf({ ...term, ...update}), [term, updateSelf]);

	const handlePropertyChange = useCallback((newProp) => {
		let updates = { property: newProp };
		// Update relationship also, if necessary
		if(!Object.keys(queries[newProp]).includes(relationship)){ updates.relationship = Object.keys(queries[newProp])[0]; }
		// Update value also, if necessary
		if(updates.relationship && !queries[newProp][updates.relationship].checkInput(value)) { updates.value = queries[newProp][updates.relationship].defaultInput; }

		handlePropChange(updates);
	}, [handlePropChange, relationship, value]);
	const handleRelationshipChange = useCallback((newRel) => {
		let updates = { relationship: newRel };
		// Update value also, if necessary
		if(!queries[property][newRel].checkInput(value)) { updates.value = queries[property][newRel].defaultInput; }

		handlePropChange(updates);
	}, [handlePropChange, property, value]);
	const handleValueChange = useCallback((value) => handlePropChange({ value }), [handlePropChange]);

	return <div className="zr-query-entry">
		{!isFirstChild && <span zr-role="query-entry-operator">{useOR ? "AND" : "OR"}</span>}
		<div>
			<Select2 
				filterable={false} 
				itemRenderer={itemRenderer}
				items={Object.keys(queries)}
				menuProps={propertyProps}
				onItemSelect={handlePropertyChange}
				placement="bottom"
				popoverProps={popoverProps}
				popoverTargetProps={propertyProps} >
				<Button minimal={true} rightIcon="caret-down" text={property} />
			</Select2>
			<Select2 
				filterable={false} 
				itemRenderer={itemRenderer}
				items={Object.keys(queries[property])}
				menuProps={relationshipProps}
				onItemSelect={handleRelationshipChange}
				placement="bottom"
				popoverProps={popoverProps}
				popoverTargetProps={relationshipProps} >
				<Button minimal={true} rightIcon="caret-down" text={relationship} />
			</Select2>
			<InputComponent property={property} relationship={relationship} value={value} setValue={handleValueChange} />
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
				<Button className="zr-query-entry--remove-self" icon={isOnlyChild ? "cross" : "small-cross"} intent={isOnlyChild ? null : "danger"} minimal={true} onClick={removeSelf} title="Remove query term" />
			</div>}
	</div>;
}
QueryEntry.propTypes = {
	handlers: shape({
		removeSelf: func,
		updateSelf: func
	}),
	isFirstChild: bool,
	isOnlyChild: bool,
	term: shape({
		property: oneOf(Object.keys(queries)),
		relationship: string,
		value: any
	}),
	useOR: bool
};

export default QueryEntry;
