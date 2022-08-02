import React, { useCallback, useMemo } from "react";
import { arrayOf, bool, func, node, object, objectOf, oneOfType, shape, string } from "prop-types";

import { Button, Checkbox, Classes, H4, H5, InputGroup, MenuItem, Switch } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";

import InputMultiSelect from "../Inputs/InputMultiSelect";
import TagsSelector from "../Inputs/TagsSelector";

import { CustomClasses } from "../../constants";

const popoverProps = {
	canEscapeKeyClose: false,
	minimal: true,
	placement: "bottom",
	popoverClassName: CustomClasses.POPOVER
};

function renderAsMenuItem(item, itemProps) {
	const { handleClick/*, modifiers: { active }*/ } = itemProps;

	return <MenuItem key={item.value} onClick={handleClick} text={item.label} />;
}

const Row = ({ children }) => <div zr-role="settings-row">{children}</div>;
Row.propTypes = {
	children: node
};

const RowCol = ({ children, description = null, rightElement = null, title = null }) => (
	<div zr-role="settings-row-col">
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		{rightElement}
		<div zr-role="settings-row-col--container">
			{children}
		</div>
	</div>
);
RowCol.propTypes = {
	children: node,
	description: string,
	rightElement: node,
	title: string
};

const RowGroup = ({ children, description = null, onChange, options, selected, title = null }) => {
	const childrenWithProps = React.Children.map(children, (child) => {
		if (React.isValidElement(child)) {
			return React.cloneElement(child, { handleSelect: onChange, options, selected });
		}
		return child;
	});

	return <div zr-role="settings-row-group">
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		{childrenWithProps}
	</div>;
};
RowGroup.propTypes = {
	children: node,
	description: string,
	onChange: func,
	options: objectOf(string),
	selected: string,
	title: string
};

const RowGroupOption = ({ children, description = null, handleSelect, id, options, selected }) => {
	const onChange = useCallback(() => handleSelect(id), [handleSelect, id]);

	return <div zr-role="settings-rowgroup--option" zr-row-option-selected={(selected == id).toString()}>
		<Checkbox
			checked={selected == id}
			className="zr-settings-rowgroup--option"
			inline={false}
			labelElement={<div>
				<OptionTitle>{options[id]}</OptionTitle>
				{description && <Description>{description}</Description>}
			</div>}
			onChange={onChange}
		/>
		{children}
	</div>;
};
RowGroupOption.propTypes = {
	children: node,
	description: string,
	handleSelect: func,
	id: string,
	options: objectOf(string),
	selected: string
};

const Title = ({ children }) => <H4>{children}</H4>;
Title.propTypes = {
	children: node
};

const OptionTitle = ({ children }) => <H5>{children}</H5>;
OptionTitle.propTypes = {
	children: node
};

const Description = ({ children }) => <span className={[CustomClasses.TEXT_SECONDARY, CustomClasses.TEXT_SMALL].join(" ")}>{children}</span>;
Description.propTypes = {
	children: node
};

const MultiInput = ({ description = null, options, setValue, title = null, value }) => {
	return <Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<TextInput>
			<InputMultiSelect className={CustomClasses.TEXT_SMALL} options={options} setValue={setValue} value={value} />
		</TextInput>
	</Row>;
};
MultiInput.propTypes = {
	description: node,
	options: arrayOf(shape({
		label: string,
		value: string
	})),
	setValue: func,
	title: node,
	value: arrayOf(string)
};

const RoamTagsInput = ({ description, onChange, title = null, value }) => {
	const selectTag = useCallback((val) => {
		onChange(Array.from(new Set([...value, val])));
	}, [onChange, value]);

	const removeTag = useCallback((val) => {
		onChange(value.filter(v => v != val));
	}, [onChange, value]);

	return <Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<TextInput>
			<TagsSelector className={CustomClasses.TEXT_SMALL} onRemove={removeTag} onSelect={selectTag} selectedTags={value} />
		</TextInput>
	</Row>;
};
RoamTagsInput.propTypes = {
	description: node,
	onChange: func,
	title: string,
	value: arrayOf(string)
};

const SingleInput = ({ buttonProps = {}, description= null, menuTitle, onChange, options, title = null, value }) => {

	const menuProps = useMemo(() => ({
		title: menuTitle
	}), [menuTitle]);

	const popoverTargetProps = useMemo(() => ({
		style: { textAlign: "right" },
		title: menuTitle
	}), [menuTitle]);

	const selectValue = useCallback((item) => {
		onChange(item.value);
	}, [onChange]);

	return <Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<Select2
			className={["zr-setting--single-input", CustomClasses.TEXT_SMALL].join(" ")}
			filterable={false}
			itemRenderer={renderAsMenuItem}
			itemsEqual="value"
			items={options}
			menuProps={menuProps}
			onItemSelect={selectValue}
			placement="bottom"
			popoverProps={popoverProps}
			popoverTargetProps={popoverTargetProps} >
			<Button alignText="right" intent="primary" minimal={true} rightIcon="caret-down" text={options.find(op => op.value == value).label} {...buttonProps} />
		</Select2>
	</Row>;
};
SingleInput.propTypes = {
	buttonProps: object,
	description: node,
	menuTitle: string,
	onChange: func,
	options: arrayOf(shape({ label: string, value: oneOfType([string, bool]) })),
	title: node,
	value: oneOfType([string, bool])
};

const TextInput = ({ children }) => <div className="zr-text-input" zr-role="input-text">{children}</div>;
TextInput.propTypes = {
	children: node
};

const TextField = ({ description = null, ifEmpty = null, label = null, onChange = null, placeholder = null, title = null, value, ...extraProps }) => {
	const valueHandler = useCallback((event) => onChange(event.target.value), [onChange]);

	return <Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<TextInput>
			{value || ifEmpty == true
				? <input 
					aria-label={label}
					autoComplete="off" 
					className={["zr-text-input", CustomClasses.TEXT_SMALL, Classes.INPUT].join(" ")}
					onChange={valueHandler}
					placeholder={placeholder}
					spellCheck="false" 
					title={label}
					type="text"
					value={String(value)}
					{...extraProps} />
				: ifEmpty
			}
		</TextInput>
	</Row>;
};
TextField.propTypes = {
	description: node,
	ifEmpty: oneOfType([node, bool]),
	label: string,
	onChange: func,
	placeholder: string,
	title: node,
	value: string
};

const TextWithSelect = ({ description = null, onSelectChange, onValueChange, placeholder = null, selectOptions, selectValue, textValue, title = null, inputGroupProps = {}, inputLabel, selectButtonProps = {}, selectProps = {}, selectLabel }) => {
	const selectHandler = useCallback((item) => onSelectChange(item.value), [onSelectChange]);
    
	const selectElement = useMemo(() => {
		const { menuProps, popoverTargetProps, ...otherProps } = selectProps;

		const mergedMenuProps = {
			title: selectLabel,
			...menuProps
		};

		const mergedPopoverTargetProps = {
			title: selectLabel,
			...popoverTargetProps
		};

		return <Select2
			className={CustomClasses.TEXT_SMALL}
			fill={false}
			filterable={false}
			itemRenderer={renderAsMenuItem}
			itemsEqual="value"
			items={selectOptions}
			menuProps={mergedMenuProps} 
			onItemSelect={selectHandler}
			placement="bottom"
			popoverProps={popoverProps}
			popoverTargetProps={mergedPopoverTargetProps}
			{...otherProps} >
			<Button alignText="right" minimal={true} text={selectOptions.find(op => op.value == selectValue).label} {...selectButtonProps} />
		</Select2>;
	}, [selectButtonProps, selectHandler, selectLabel, selectOptions, selectProps, selectValue]);

	const valueHandler = useCallback((event) => onValueChange(event.target.value), [onValueChange]);

	return <Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<InputGroup
			aria-label={inputLabel}
			autoComplete="off"
			className={["zr-text-input", CustomClasses.TEXT_SMALL].join(" ")}
			leftElement={selectElement}
			onChange={valueHandler}
			placeholder={placeholder}
			spellCheck="false"
			title={inputLabel}
			type="text"
			value={textValue}
			{...inputGroupProps}
		/>
	</Row>;
};
TextWithSelect.propTypes = {
	description: node,
	onSelectChange: func,
	onValueChange: func,
	placeholder: string,
	selectOptions: arrayOf(shape({ label: string, value: oneOfType([string, bool]) })),
	selectValue: oneOfType([string, bool]),
	textValue: string,
	title: node,
	inputGroupProps: object,
	inputLabel: string,
	selectButtonProps: object,
	selectProps: object,
	selectLabel: string
};

const Toggle = ({ description = null, isChecked, label, onChange = null, title = null, ...extraProps }) => (
	<Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<Switch aria-checked={isChecked} checked={isChecked} aria-label={label} onChange={onChange} role="switch" {...extraProps} />
	</Row>
);
Toggle.propTypes = {
	description: node,
	isChecked: bool,
	label: string,
	onChange: func,
	title: node
};

export {
	MultiInput,
	RoamTagsInput,
	RowCol,
	RowGroup,
	RowGroupOption,
	SingleInput,
	TextField,
	TextWithSelect,
	Toggle
};