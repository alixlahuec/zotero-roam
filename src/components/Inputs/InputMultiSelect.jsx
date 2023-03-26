import { arrayOf, func, shape, string } from "prop-types";
import { useCallback, useMemo } from "react";

import { Icon, MenuItem } from "@blueprintjs/core";
import { MultiSelect } from "@blueprintjs/select";

import { searchEngine } from "../../utils";

import { CustomClasses } from "../../constants";


const popoverProps = {
	canEscapeKeyClose: false,
	fill: true,
	matchTargetWidth: true,
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

function tagRenderer(item){ return item.label; }

function InputMultiSelect({ options = [], value = [], setValue, ...props }){
	const selectedItems = useMemo(() => options.filter(op => value.includes(op.value)), [options, value]);
	const onItemSelect = useCallback((item, _event) => setValue([...value, item.value]), [setValue, value]);
	const onRemove = useCallback((item, _index) => setValue(value.filter(val => val != item.value)), [setValue, value]);

	const itemRenderer = useCallback((item, itemProps) => {
		const { handleClick, /*modifiers: { active }*/ } = itemProps;
		const isSelected = value.includes(item.value);

		return <MenuItem aria-selected={isSelected} key={item.value} labelElement={isSelected ? <Icon icon="small-tick" /> : null} onClick={handleClick} text={item.label} />;
	}, [value]);

	return <MultiSelect
		initialContent={null}
		itemPredicate={itemPredicate}
		itemRenderer={itemRenderer}
		itemsEqual="value"
		items={options}
		onItemSelect={onItemSelect}
		onRemove={onRemove}
		openOnKeyDown={true}
		popoverProps={popoverProps}
		resetOnSelect={true}
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

export { InputMultiSelect };
