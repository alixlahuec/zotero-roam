import React, { useCallback, useMemo } from "react";
import { arrayOf, func, shape, string } from "prop-types";
import { MenuItem } from "@blueprintjs/core";
import { MultiSelect2 } from "@blueprintjs/select";

import { searchEngine } from "../../utils";

import { CustomClasses } from "../../constants";

const popoverProps = {
	canEscapeKeyClose: false,
	fill: true,
	minimal: true,
	popoverClassName: CustomClasses.POPOVER
};

const tagInputProps = {
	inputProps: {
		autoComplete: "off",
		placeholder: "Add...",
		spellCheck: "false"
	},
	placeholder: "Click to add an element"
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
	return <MenuItem active={active} key={item.value} onClick={handleClick} text={item.label} />;
}

function tagRenderer(item){ return item.label; }

function InputMultiSelect({ options = [], value = [], setValue, ...props }){
	const selectedItems = useMemo(() => options.filter(op => value.includes(op.value)), [options, value]);
	const onItemSelect = useCallback((item, _event) => setValue([...value, item.value]), [setValue, value]);
	const onRemove = useCallback((item, _index) => setValue(value.filter(val => val != item.value)), [setValue, value]);

	return <MultiSelect2
		initialContent={null}
		itemPredicate={itemPredicate}
		itemRenderer={itemRenderer}
        itemsEqual="value"
		items={options}
		onItemSelect={onItemSelect}
		onRemove={onRemove}
		openOnKeyDown={false}
		popoverProps={popoverProps}
		selectedItems={selectedItems}
		tagInputProps={tagInputProps}
		tagRenderer={tagRenderer}
        {...props}
	/>;
}
InputMultiSelect.propTypes = {
	options: arrayOf(shape({ label: string, value: string })),
	value: arrayOf(string),
	setValue: func
};

export default InputMultiSelect;
