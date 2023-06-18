import { useCallback, useMemo } from "react";
import { Icon, MenuItem } from "@blueprintjs/core";
import { MultiSelect, MultiSelectProps } from "@blueprintjs/select";

import { searchEngine } from "../../utils";
import { CustomClasses } from "../../constants";


type Option = {
	label: string,
	value: string
};

type SelectorProps = MultiSelectProps<Option>;

const staticProps: Partial<SelectorProps> & Pick<SelectorProps, "tagRenderer"> = {
	className: CustomClasses.TEXT_SMALL,
	initialContent: null,
	itemPredicate: (query, item) => {
		return searchEngine(query, item.label,
			{
				any_case: true,
				match: "partial",
				search_compounds: false,
				word_order: "loose"
			}
		);
	},
	itemsEqual: "value",
	openOnKeyDown: true,
	popoverProps: {
		canEscapeKeyClose: false,
		fill: true,
		minimal: true,
		popoverClassName: CustomClasses.POPOVER
	},
	resetOnSelect: true,
	tagInputProps: {
		inputProps: {
			autoComplete: "off",
			placeholder: "Add...",
			spellCheck: "false"
		},
		placeholder: "Click to add an element"
	},
	tagRenderer: (item) => item.label
};


type OwnProps = {
	options: SelectorProps["items"],
	value: Option["value"][],
	setValue: (value: Option["value"][]) => void
};

function InputMultiSelect({ options = [], value = [], setValue, ...extraProps }: OwnProps & Partial<SelectorProps>){
	const selectedItems = useMemo(() => options.filter(op => value.includes(op.value)), [options, value]);
	const onItemSelect = useCallback<SelectorProps["onItemSelect"]>((item, _event) => setValue([...value, item.value]), [setValue, value]);
	const onRemove = useCallback<NonNullable<SelectorProps["onRemove"]>>((item, _index) => setValue(value.filter(val => val != item.value)), [setValue, value]);

	const itemRenderer = useCallback<SelectorProps["itemRenderer"]>((item, itemProps) => {
		const { handleClick/*, modifiers: { active }*/ } = itemProps;
		const isSelected = value.includes(item.value);

		return <MenuItem aria-selected={isSelected} key={item.value} labelElement={isSelected ? <Icon icon="small-tick" /> : null} onClick={handleClick} text={item.label} />;
	}, [value]);

	return <MultiSelect<Option>
		itemRenderer={itemRenderer}
		items={options}
		onItemSelect={onItemSelect}
		onRemove={onRemove}
		selectedItems={selectedItems}
		{...staticProps}
		{...extraProps}
	/>;
}

export type InputMultiSelectProps = OwnProps;
export { InputMultiSelect };
