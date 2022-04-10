import React, { useCallback, useContext, useMemo } from "react";
import { func, string } from "prop-types";
import { MenuItem } from "@blueprintjs/core";
import { MultiSelect } from "@blueprintjs/select";

import { UserSettings } from "../App";
import { searchEngine } from "../../utils";

const popoverProps = {
	canEscapeKeyClose: false,
	fill: true,
	minimal: true,
	popoverClassName: "zr-popover"
};

function itemPredicate(query, item) {
	return searchEngine(query, item.label, 
		{
			any_case: true,
			match: "partial",
			search_compounds: false,
			word_order: "loose"
		}
	);
}

function itemRenderer(item, itemProps) {
	let { handleClick, modifiers: { active } } = itemProps;
	return <MenuItem active={active} key={item} onClick={handleClick} text={item.label} />;
}

function tagRenderer(item){ return item.label; }

function ItemType({ value = [], updateValue }){
	const { typemap } = useContext(UserSettings);

	const typeOptions = useMemo(() => {
		return Object.keys(typemap)
			.map(k => ({ itemType: k, label: typemap[k]}));
	}, [typemap]);

	const onItemSelect = useCallback((item, _event) => {
		updateValue([...value, item.itemType]);
	}, [updateValue, value]);

	const onRemove = useCallback((item, _index) => {
		updateValue(value.filter(val => val != item.itemType));
	}, [updateValue, value]);

	return <MultiSelect
		initialContent={null}
		itemPredicate={itemPredicate}
		itemRenderer={itemRenderer}
		items={typeOptions}
		onItemSelect={onItemSelect}
		onRemove={onRemove}
		popoverProps={popoverProps}
		selectedItems={value}
		tagRenderer={tagRenderer}
	/>;
}
ItemType.propTypes = {
	value: string,
	updateValue: func
};

export default ItemType;
