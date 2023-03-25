import { FC, HTMLAttributes, useCallback, useMemo } from "react";
import { Button, ButtonProps, Icon, Menu, MenuItem } from "@blueprintjs/core";
import { Placement } from "@blueprintjs/popover2";
import { Select, IListItemsProps } from "@blueprintjs/select";

import { CustomClasses } from "../../../constants";


const popoverProps = {
	canEscapeKeyClose: false,
	minimal: true,
	placement: "bottom" as Placement,
	popoverClassName: CustomClasses.POPOVER
};

type Option = { label: string, value: string | boolean };
type ListProps = IListItemsProps<Option>;

type OwnProps = {
	buttonProps?: Partial<ButtonProps>,
	onSelect: (val: Option["value"]) => void,
	options: Option[],
	popoverTargetProps: HTMLAttributes<HTMLElement>,
	selectedValue: Option["value"]
};

const BetterSelect: FC<OwnProps> = (props) => {
	const { buttonProps = {}, onSelect, options, popoverTargetProps, selectedValue, ...extraProps } = props;

	const selectHandler = useCallback<ListProps["onItemSelect"]>((item) => onSelect(item.value), [onSelect]);

	const itemRenderer = useCallback<ListProps["itemRenderer"]>((item, itemProps) => {
		const { handleClick/*, modifiers: { active }*/ } = itemProps;
		const isSelected = item.value == selectedValue;

		return <MenuItem key={`${item.value}`} htmlTitle={item.label} labelElement={isSelected ? <Icon icon="small-tick" /> : null} onClick={handleClick} aria-selected={isSelected} text={item.label} />;
	}, [selectedValue]);

	const menuRenderer =  useCallback(({ items, itemsParentRef, renderItem }) => {
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
		className={["zr-setting--single-input", CustomClasses.TEXT_SMALL].join(" ")}
		filterable={false}
		itemListRenderer={menuRenderer}
		itemRenderer={itemRenderer}
		itemsEqual="value"
		items={options}
		matchTargetWidth={false}
		onItemSelect={selectHandler}
		popoverProps={mergedPopoverProps}
		{...extraProps} >
		<Button alignText="right" intent="primary" minimal={true} rightIcon="caret-down" text={options.find(op => op.value == selectedValue)!.label} {...buttonProps} />
	</Select>;
};

export { BetterSelect };