import React, { useCallback, useMemo } from "react";
import { bool, func, oneOf, oneOfType, shape, string } from "prop-types";
import { Button, MenuItem, InputGroup } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";

import { queries } from "./queries";

const popoverProps = {
	minimal: true,
	popoverClassName: "zr-popover"
};

function itemRenderer(item, itemProps) {
	const { handleClick, modifiers: { active } } = itemProps;

	return <MenuItem active={active} key={item} onClick={handleClick} text={item} />;
}

function QueryEntry({ handlers, term, useOR = false }){
	const { addSiblingTerm, removeSelf, updateSelf } = handlers;
	const { property, relationship, value = "" } = term;

	const handlePropChange = useCallback((update) => updateSelf({ ...term, ...update}), [term, updateSelf]);

	const handlePropertyChange = useCallback((newProp) => {
		let updates = { property: newProp };
		// Update relationship also, if necessary
		if(!Object.keys(queries[newProp]).includes(relationship)){ updates.relationship = Object.keys(queries[newProp])[0]; }
		// Update value also, if necessary
		if(updates.relationship && !queries[newProp][updates.relationship].checkInput(value)) { updates.value = ""; }

		handlePropChange(updates);
	}, [handlePropChange, relationship, value]);
	const handleRelationshipChange = useCallback((newRel) => {
		let updates = { relationship: newRel };
		// Update value also, if necessary
		if(!queries[property][newRel].checkInput(value)) { updates.value = ""; }

		handlePropChange(updates);
	}, [handlePropChange, property, value]);
	const handleValueChange = useCallback((event) => handlePropChange({ value: event.target.value }), [handlePropChange]);

	const removeEntryButton = useMemo(() => {
		return removeSelf
			? <Button className="zr-query-entry--remove-self" icon="small-cross" intent="danger" minimal={true} onClick={removeSelf} />
			: null;
	}, [removeSelf]);

	return <div className="zr-query-entry">
		<Select 
			filterable={false} 
			itemRenderer={itemRenderer}
			items={Object.keys(queries)}
			onItemSelect={handlePropertyChange}
			placement="bottom"
			popoverProps={popoverProps}>
			<Button minimal={true} rightIcon="caret-down" text={property} />
		</Select>
		<Select 
			filterable={false} 
			itemRenderer={itemRenderer}
			items={Object.keys(queries[property])}
			onItemSelect={handleRelationshipChange}
			placement="bottom"
			popoverProps={popoverProps}>
			<Button minimal={true} rightIcon="caret-down" text={relationship} />
		</Select>
		<InputGroup onChange={handleValueChange} value={value} />
		{removeEntryButton}
		<Button className={["zr-query-entry--add-sibling", "zr-text-small"].join(" ")} 
			icon="small-plus" 
			minimal={true} 
			onClick={addSiblingTerm} 
			small={true} 
			text={(useOR ? "OR" : "AND")} />
	</div>;
}
QueryEntry.propTypes = {
	handlers: shape({
		addSiblingTerm: func,
		removeSelf: oneOfType([func, bool]),
		updateSelf: func
	}),
	term: shape({
		property: oneOf(Object.keys(queries)),
		relationship: string,
		value: string
	}),
	useOR: bool
};

export default QueryEntry;
