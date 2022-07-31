import React, { useCallback, useMemo } from "react";
import { arrayOf, bool, func, node, object, oneOfType, shape, string } from "prop-types";

import { Button, Classes, H4, InputGroup, MenuItem, Switch } from "@blueprintjs/core";
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

const Title = ({ children }) => <H4 className={CustomClasses.TEXT_AUXILIARY}>{children}</H4>;

const Description = ({ children }) => <span zr-role="setting-description">{children}</span>;

const MultiInput = ({ description = null, options, setValue, title, value }) => {
	return <Row>
		<div>
			<Title>{title}</Title>
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

const RoamTagsInput = ({ description, onChange, title, value }) => {
	const selectTag = useCallback((val) => {
		onChange(Array.from(new Set([...value, val])));
	}, [onChange, value]);

	const removeTag = useCallback((val) => {
		onChange(value.filter(v => v != val));
	}, [onChange, value]);

	return <Row>
		<div>
			<Title>{title}</Title>
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

const SingleInput = ({ buttonProps = {}, description= null, menuTitle, onChange, options, title, value }) => {

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
			<Title>{title}</Title>
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
			<Button alignText="right" minimal={true} text={options.find(op => op.value == value).label} {...buttonProps} />
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

const TextField = ({ description = null, ifEmpty = null, label = null, onChange = null, placeholder = null, title, value, ...extraProps }) => {
	const valueHandler = useCallback((event) => onChange(event.target.value), [onChange]);

	return <Row>
		<div>
			<Title>{title}</Title>
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

const TextWithSelect = ({ description = null, onSelectChange, onValueChange, placeholder = null, selectOptions, selectValue, textValue, title, inputGroupProps = {}, inputLabel, selectButtonProps = {}, selectProps = {}, selectLabel }) => {
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
			<Title>{title}</Title>
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

const Toggle = ({ description = null, isChecked, label, onChange = null, title, ...extraProps }) => (
	<Row>
		<div>
			<Title>{title}</Title>
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
	SingleInput,
	TextField,
	TextWithSelect,
	Toggle
};