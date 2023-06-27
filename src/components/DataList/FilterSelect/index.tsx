import { useCallback, useMemo } from "react";
import { Button, Icon, Menu, MenuItem, Tag } from "@blueprintjs/core";
import { Select, SelectProps } from "@blueprintjs/select";

import { CustomClasses } from "../../../constants";


type Filter = {
	active: boolean,
	label: string,
	value: string
};

type SelectorProps = SelectProps<Filter>;

const popoverProps: SelectorProps["popoverProps"] = {
	canEscapeKeyClose: false,
	minimal: true,
	placement: "bottom-start",
	popoverClassName: CustomClasses.POPOVER
};

const staticProps: Partial<SelectorProps> & Pick<SelectorProps, "itemRenderer"> = {
	itemRenderer: (filter, itemProps) => {
		const { handleClick/*, modifiers: { active } */ } = itemProps;

		return <MenuItem key={filter.value} className={CustomClasses.TEXT_SECONDARY} htmlTitle={filter.label} labelElement={filter.active ? <Icon icon="small-tick" /> : null} onClick={handleClick} aria-selected={filter.active} text={filter.label} />;
	},
	itemListRenderer: (({ items, itemsParentRef, renderItem }) => {
		const renderedItems = items.map(renderItem).filter(item => item != null);
		return (
			<Menu ulRef={itemsParentRef}>
				{renderedItems}
			</Menu>
		);
	})
};


type OwnProps = {
	options: Filter[],
	toggleFilter: (value: Filter["value"]) => void
};

function FilterSelect({ options, toggleFilter }: OwnProps){
	const nbSelectedFilters = useMemo(() => options.filter(op => op.active).length, [options]);
	const selectHandler = useCallback<SelectorProps["onItemSelect"]>((filter) => toggleFilter(filter.value), [toggleFilter]);

	return <Select<Filter>
		className={CustomClasses.TEXT_SMALL}
		filterable={false}
		items={options}
		matchTargetWidth={false}
		onItemSelect={selectHandler}
		popoverProps={popoverProps}
		{...staticProps}
	>
		<Button className={CustomClasses.TEXT_SECONDARY} minimal={true} outlined={true} rightIcon={nbSelectedFilters > 0 ? <Tag minimal={true}>{nbSelectedFilters}</Tag> : "caret-down"} text="Filter" />
	</Select>;
}

export default FilterSelect;