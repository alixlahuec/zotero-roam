import { arrayOf, bool, func, object, shape, string } from "prop-types";
import { useCallback, useMemo } from "react";

import { Button, Icon, Menu, MenuItem, Tag } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";

import { CustomClasses } from "../../../constants";


const popoverProps = {
	canEscapeKeyClose: false,
	minimal: true,
	placement: "bottom-start",
	popoverClassName: CustomClasses.POPOVER
};

function FilterSelect({ options, popoverTargetProps = {}, toggleFilter }){
	const nbSelectedFilters = useMemo(() => options.filter(op => op.active).length, [options]);
	const selectHandler = useCallback((filter) => toggleFilter(filter.value), [toggleFilter]);

	const itemRenderer = useCallback((filter, itemProps) => {
		const { handleClick/*, modifiers: { active } */ } = itemProps;

		return <MenuItem key={filter.value} className={CustomClasses.TEXT_SECONDARY} htmlTitle={filter.label} labelElement={filter.active ? <Icon icon="small-tick" /> : null} onClick={handleClick} aria-selected={filter.active} text={filter.label} />;
	}, []);

	const menuRenderer = useCallback(({ items, itemsParentRef, renderItem }) => {
		const renderedItems = items.map(renderItem).filter(item => item != null);
		return (
			<Menu ulRef={itemsParentRef} {...popoverTargetProps}>
				{renderedItems}
			</Menu>
		);
	}, [popoverTargetProps]);

	const mergedPopoverProps = useMemo(() => ({
		...popoverProps,
		targetProps: popoverTargetProps
	}), [popoverTargetProps]);

	return <Select
		className={CustomClasses.TEXT_SMALL}
		filterable={false}
		itemListRenderer={menuRenderer}
		itemRenderer={itemRenderer}
		items={options}
		matchTargetWidth={false}
		onItemSelect={selectHandler}
		popoverProps={mergedPopoverProps}
	>
		<Button active={options.some(op => op.active)} className={CustomClasses.TEXT_SECONDARY} intent="primary" minimal={true} rightIcon={nbSelectedFilters > 0 ? <Tag intent="primary">{nbSelectedFilters}</Tag> : "caret-down"} text="Filter" />
	</Select>;
}
FilterSelect.propTypes = {
	options: arrayOf(shape({
		active: bool,
		label: string,
		value: string
	})),
	popoverTargetProps: object,
	toggleFilter: func
};

export default FilterSelect;