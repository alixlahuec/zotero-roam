import { useCallback, useMemo } from "react";
import { IPopoverProps, Icon, MenuItem } from "@blueprintjs/core";
import { MultiSelect, MultiSelectProps } from "@blueprintjs/select";

import { searchEngine } from "../../utils";
import { CustomClasses } from "../../constants";


type Option = {
	label: string,
	value: string
};

type SelectorProps = MultiSelectProps<Option>;

const popoverProps: Partial<IPopoverProps> = {
	canEscapeKeyClose: false,
	fill: true,
	minimal: true,
	popoverClassName: CustomClasses.POPOVER
};

const tagInputProps: SelectorProps["tagInputProps"] = {
	inputProps: {
		autoComplete: "off",
		placeholder: "Add...",
		spellCheck: "false"
	},
	placeholder: "Click to add an element"
};

const itemPredicate: SelectorProps["itemPredicate"] = (query, item) => {
	return searchEngine(query, item.label,
		{
			any_case: true,
			match: "partial",
			search_compounds: false,
			word_order: "loose"
		}
	);
};

const tagRenderer: SelectorProps["tagRenderer"] = (item) => { return item.label; };


type OwnProps = {
	options: Option[],
	value: Option["value"][],
	setValue: (value: Option["value"][]) => void
};

function InputMultiSelect({ options = [], value = [], setValue, ...props }: OwnProps & Partial<SelectorProps>){
	const selectedItems = useMemo(() => options.filter(op => value.includes(op.value)), [options, value]);
	const onItemSelect = useCallback((item, _event) => setValue([...value, item.value]), [setValue, value]);
	const onRemove = useCallback((item, _index) => setValue(value.filter(val => val != item.value)), [setValue, value]);

	const itemRenderer = useCallback<SelectorProps["itemRenderer"]>((item, itemProps) => {
		const { handleClick, /*modifiers: { active }*/ } = itemProps;
		const isSelected = value.includes(item.value);

		return <MenuItem aria-selected={isSelected} key={item.value} labelElement={isSelected ? <Icon icon="small-tick" /> : null} onClick={handleClick} text={item.label} />;
	}, [value]);

	return <MultiSelect<Option>
		className={CustomClasses.TEXT_SMALL}
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

export { InputMultiSelect };
