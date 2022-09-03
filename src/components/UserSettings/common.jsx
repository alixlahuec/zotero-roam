import { Children, cloneElement, isValidElement, useCallback, useMemo } from "react";
import { arrayOf, bool, func, node, number, object, objectOf, oneOfType, shape, string } from "prop-types";

import { Button, Checkbox, Classes, ControlGroup, H4, H5, Icon, InputGroup, Menu, MenuItem, NumericInput, Switch, TextArea } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";

import InputMultiSelect from "../Inputs/InputMultiSelect";
import TagsSelector from "../Inputs/TagsSelector";

import { CustomClasses } from "../../constants";


const popoverProps = {
	canEscapeKeyClose: false,
	minimal: true,
	placement: "bottom",
	popoverClassName: CustomClasses.POPOVER
};

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
	const childrenWithProps = Children.map(children, (child) => {
		if (isValidElement(child)) {
			return cloneElement(child, { handleSelect: onChange, options, selected });
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

const NumericSelect = ({ description = null, label, setValue, title = null, value, ...extraProps }) => {
	const handler = useCallback((num, _numAsString) => setValue(num), [setValue]);

	return <Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<NumericInput aria-label={label} min={0} minorStepSize={1} onValueChange={handler} selectAllOnFocus={true} selectAllOnIncrement={true} {...extraProps} />
	</Row>;
};
NumericSelect.propTypes = {
	description: node,
	label: string,
	setValue: func,
	title: node,
	value: number
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

const BetterSelect = ({ buttonProps = {}, menuProps, onSelect, options, popoverTargetProps, selectedValue, ...extraProps }) => {

	const selectHandler = useCallback((item) => onSelect(item.value), [onSelect]);

	const itemRenderer = useCallback((item, itemProps) => {
		const { handleClick/*, modifiers: { active }*/ } = itemProps;
		const isSelected = item.value == selectedValue;

		return <MenuItem key={item.value} htmlTitle={item.label} labelElement={isSelected ? <Icon icon="small-tick" /> : null} onClick={handleClick} aria-selected={isSelected} text={item.label} />;
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
		<Button alignText="right" intent="primary" minimal={true} rightIcon="caret-down" text={options.find(op => op.value == selectedValue).label} {...buttonProps} />
	</Select>;
};
BetterSelect.propTypes = {
	buttonProps: object,
	menuProps: object,
	onSelect: func,
	options: arrayOf(shape({ label: string, value: oneOfType([string, bool]) })),
	popoverTargetProps: object,
	selectedValue: oneOfType([string, bool])
};

const SingleInput = ({ buttonProps = {}, description = null, menuTitle, onChange, options, selectProps = {}, title = null, value }) => {

	const suppProps = useMemo(() => ({
		title: menuTitle
	}), [menuTitle]);

	return <Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<BetterSelect buttonProps={buttonProps} options={options} menuProps={suppProps} onSelect={onChange} popoverTargetProps={suppProps} selectedValue={value} {...selectProps} />
	</Row>;
};
SingleInput.propTypes = {
	buttonProps: object,
	description: node,
	menuTitle: string,
	onChange: func,
	options: arrayOf(shape({ label: string, value: oneOfType([string, bool]) })),
	selectProps: object,
	title: node,
	value: oneOfType([string, bool])
};

const TextAreaInput = ({ label = null, onChange, value, ...extraProps }) => {
	const valueHandler = useCallback((event) => onChange(event.target.value), [onChange]);

	return <TextArea 
		aria-label={label}
		autoComplete="off" 
		className={["zr-text-input", CustomClasses.TEXT_SMALL, Classes.INPUT].join(" ")}
		fill={true}
		growVertically={true}
		onChange={valueHandler}
		spellCheck="false" 
		title={label}
		value={value}
		{...extraProps} />;
};
TextAreaInput.propTypes = {
	label: string,
	onChange: func,
	value: string
};

const TextInput = ({ children }) => <div className="zr-text-input" zr-role="input-text">{children}</div>;
TextInput.propTypes = {
	children: node
};

const TextField = ({ description = null, ifEmpty = null, label = null, onChange, placeholder = null, title = null, value, ...extraProps }) => {
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
					value={value}
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
	const { menuProps, popoverTargetProps, ...otherProps } = selectProps;
    
	const mergedMenuProps = useMemo(() => ({
		title: selectLabel,
		...menuProps
	}), [selectLabel, menuProps]);

	const mergedPopoverTargetProps = useMemo(() => ({
		title: selectLabel,
		...popoverTargetProps
	}), [selectLabel, popoverTargetProps]);

	const mergedSelectButtonProps = useMemo(() => ({
		...selectButtonProps
	}), [selectButtonProps]);

	const valueHandler = useCallback((event) => onValueChange(event.target.value), [onValueChange]);

	return <Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<ControlGroup className="zr-text-select-group">
			<BetterSelect
				buttonProps={mergedSelectButtonProps}
				menuProps={mergedMenuProps}
				onSelect={onSelectChange}
				options={selectOptions}
				popoverTargetProps={mergedPopoverTargetProps}
				selectedValue={selectValue}
				{...otherProps}
			/>
			<InputGroup
				aria-label={inputLabel}
				autoComplete="off"
				className={["zr-text-input", CustomClasses.TEXT_SMALL].join(" ")}
				onChange={valueHandler}
				placeholder={placeholder}
				spellCheck="false"
				title={inputLabel}
				type="text"
				value={textValue}
				{...inputGroupProps}
			/>
		</ControlGroup>
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
	NumericSelect,
	RoamTagsInput,
	RowCol,
	RowGroup,
	RowGroupOption,
	SingleInput,
	TextAreaInput,
	TextField,
	TextWithSelect,
	Toggle
};