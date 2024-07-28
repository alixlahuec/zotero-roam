import { ChangeEventHandler, Children, ComponentType, FC, FormEventHandler, HTMLAttributes, ReactElement, ReactNode, cloneElement, useCallback, useMemo } from "react";
import { Button, ButtonProps, Checkbox, Classes, Code, ControlGroup, H4, H5, IPopoverProps, Icon, InputGroup, InputGroupProps, Menu, MenuItem, NumericInput, NumericInputProps, Switch, SwitchProps, TextArea, TextAreaProps } from "@blueprintjs/core";
import { IListItemsProps, Select, SelectProps } from "@blueprintjs/select";
import { Placement } from "@blueprintjs/popover2";

import { useBool } from "@hooks";

import { CustomClasses } from "../../constants";
import { AsBoolean } from "Types/helpers";

import "./common.sass";


const popoverProps: Partial<IPopoverProps> = {
	canEscapeKeyClose: false,
	minimal: true,
	placement: "bottom" as Placement,
	popoverClassName: CustomClasses.POPOVER
};


/** Converts a string from camelCase to Title Case
 * @see https://stackoverflow.com/questions/7225407/convert-camelcasetext-to-title-case-text */
function camelToTitleCase(text: string): string {
	const result = text.replace(/([A-Z])/g, " $1");
	const finalResult = result.charAt(0).toUpperCase() + result.slice(1);

	return finalResult;
}


const Row: FC = ({ children }) => <div zr-role="settings-row">{children}</div>;


type RowColProps = {
	description?: ReactNode,
	rightElement?: ReactNode,
	title?: ReactNode
};

const RowCol: FC<RowColProps> = ({ children, description = null, rightElement = null, title = null }) => (
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


type RowGroupOptions = Record<string, string>;

type RowGroupProps = {
	description?: ReactNode,
	onChange: RowGroupOptionProps["handleSelect"],
	options: RowGroupOptions,
	selected: string,
	title?: ReactNode
};

const RowGroup: FC<RowGroupProps> = ({ children, description = null, onChange, options, selected, title = null }) => {
	return <div zr-role="settings-row-group">
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		{Children.map<ReactNode, ReactNode>(children, (child) => {
			return cloneElement(
				child as ReactElement<RowGroupOptionProps>,
				{ handleSelect: onChange, options, selected }
			);
		})}
	</div>;
};


type RowGroupOptionPublicProps = {
	alignToBaseline?: boolean,
	description?: ReactNode,
	id: keyof RowGroupOptions
};

type RowGroupOptionProps = RowGroupOptionPublicProps & {
	handleSelect: (value: RowGroupOptionPublicProps["id"]) => void,
	options: RowGroupOptions,
	selected: keyof RowGroupOptions
};

const _RowGroupOption: FC<RowGroupOptionProps> = ({ alignToBaseline = false, children, description = null, handleSelect, id, options, selected }) => {
	const isSelected = useMemo(() => selected == id, [id, selected]);
	const onChange = useCallback(() => handleSelect(id), [handleSelect, id]);

	return <div className={["zr-settings-rowgroup--option", alignToBaseline && "align-items-baseline"].filter(AsBoolean).join(" ")} >
		<Checkbox
			checked={selected == id}
			className={["zr-settings-rowgroup--option-label", isSelected && "selected"].filter(AsBoolean).join(" ")}
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

const RowGroupOption = _RowGroupOption as ComponentType<RowGroupOptionPublicProps>;


const Title: FC = ({ children }) => <H4>{children}</H4>;


const OptionTitle: FC = ({ children }) => <H5>{children}</H5>;


const Description: FC = ({ children }) => <span className={[CustomClasses.TEXT_SECONDARY, CustomClasses.TEXT_SMALL].join(" ")}>{children}</span>;


const Definition = ({ item, text = null }: { item: string, text?: string | null }) => <div className="zr-definition--wrapper">
	<Code className="zr-definition--item">{item}</Code>
	{text && <span>{text}</span>}
</div>;


type NumericSelectProps = {
	description?: ReactNode,
	label: string,
	title?: ReactNode,
	value: number,
	setValue: (val: number) => void
} & Partial<NumericInputProps>;

const NumericSelect = ({ description = null, label, setValue, title = null, value, ...extraProps }: NumericSelectProps) => {
	const handler = useCallback<NonNullable<NumericInputProps["onValueChange"]>>((num, _numAsString) => setValue(num), [setValue]);

	return <Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<NumericInput aria-label={label} min={0} minorStepSize={1} onValueChange={handler} selectAllOnFocus={true} selectAllOnIncrement={true} {...extraProps} />
	</Row>;
};


type BetterSelectOption = {
	label: string,
	value: string | boolean
};

type BetterSelectListProps = IListItemsProps<BetterSelectOption>;

type BetterSelectProps = {
	buttonProps?: Partial<ButtonProps>,
	onSelect: (value: BetterSelectOption["value"]) => void,
	options: BetterSelectOption[],
	popoverTargetProps?: HTMLAttributes<HTMLElement>,
	value: BetterSelectOption["value"]
} & Partial<SelectProps<BetterSelectOption>>;

const BetterSelect = ({ buttonProps = {}, onSelect, options, popoverTargetProps = {}, value, ...extraProps }: BetterSelectProps) => {

	const selectHandler = useCallback<BetterSelectListProps["onItemSelect"]>((item) => onSelect(item.value), [onSelect]);

	const itemRenderer = useCallback<BetterSelectListProps["itemRenderer"]>((item, itemProps) => {
		const { handleClick/*, modifiers: { active }*/ } = itemProps;
		const isSelected = item.value == value;

		return <MenuItem key={item.value.toString()} htmlTitle={item.label} labelElement={isSelected ? <Icon icon="small-tick" /> : null} onClick={handleClick} aria-selected={isSelected} text={item.label} />;
	}, [value]);

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
		<Button alignText="right" intent="primary" minimal={true} rightIcon="caret-down" text={options.find(op => op.value == value)!.label} {...buttonProps} />
	</Select>;
};


type SingleInputProps = {
	description?: ReactNode,
	menuTitle: string,
	title?: ReactNode,
} & Omit<BetterSelectProps, "popoverTargetProps">;

const SingleInput = ({ buttonProps = {}, description = null, menuTitle, onSelect, options, title = null, value, ...extraProps }: SingleInputProps) => {

	const suppProps = useMemo(() => ({
		title: menuTitle
	}), [menuTitle]);

	return <Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<BetterSelect buttonProps={buttonProps} options={options} onSelect={onSelect} popoverTargetProps={suppProps} value={value} {...extraProps} />
	</Row>;
};


type TextAreaInputProps = {
	label?: string,
	onChange: (value: string) => void,
	value: string
} & Partial<Omit<TextAreaProps, "onChange">>;

const TextAreaInput = ({ label = undefined, onChange, value, ...extraProps }: TextAreaInputProps) => {
	const valueHandler = useCallback<NonNullable<TextAreaProps["onChange"]>>((event) => onChange(event.target.value), [onChange]);

	return <TextArea 
		aria-label={label}
		autoComplete="off" 
		className={[CustomClasses.INPUT_TEXT, CustomClasses.TEXT_AUXILIARY, CustomClasses.TEXT_SMALL, Classes.CODE_BLOCK].join(" ")}
		fill={true}
		growVertically={false}
		onChange={valueHandler}
		spellCheck="false" 
		title={label}
		value={value}
		{...extraProps} />;
};


const TextInput: FC = ({ children }) => <div className={[CustomClasses.INPUT_BOX, CustomClasses.INPUT_TEXT].join(" ")} zr-role="input-text">{children}</div>;


const defaultValidator = (_text: string) => true;

type TextFieldProps = {
	description?: ReactNode,
	ifEmpty?: ReactNode | boolean,
	label?: string,
	onChange: (value: string) => void,
	placeholder?: string,
	title?: ReactNode,
	validate?: (value: string) => boolean,
	value: string
};

const TextField = ({ description = null, ifEmpty = null, label = undefined, onChange, placeholder = undefined, title = null, validate = defaultValidator, value, ...extraProps }: TextFieldProps) => {
	const [isValid, { set: setIsValid }] = useBool(validate(value));
	const valueHandler = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => {
		onChange(event.target.value);
		setIsValid(validate(event.target.value));
	}, [onChange, setIsValid, validate]);

	return <Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<TextInput>
			{value || ifEmpty == true
				? <input 
					aria-invalid={!isValid}
					aria-label={label}
					autoComplete="off" 
					className={[CustomClasses.INPUT_BOX, CustomClasses.INPUT_TEXT, CustomClasses.TEXT_SMALL, Classes.INPUT].join(" ")}
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


type TextWithSelectProps = {
	description?: ReactNode,
	onSelectChange: BetterSelectProps["onSelect"],
	onValueChange: (value: string) => void,
	placeholder?: string,
	selectOptions: BetterSelectProps["options"],
	selectValue: BetterSelectProps["value"],
	textValue: string,
	title?: ReactNode,
	inputGroupProps?: Partial<InputGroupProps>,
	inputLabel: string,
	selectButtonProps?: BetterSelectProps["buttonProps"],
	selectProps?: {
		popoverTargetProps?: HTMLAttributes<HTMLElement>
	} & Partial<SelectProps<BetterSelectOption>>,
	selectLabel: string
};

const TextWithSelect = ({ description = null, onSelectChange, onValueChange, placeholder = undefined, selectOptions, selectValue, textValue, title = null, inputGroupProps = {}, inputLabel, selectButtonProps = {}, selectProps = {}, selectLabel }: TextWithSelectProps) => {
	const { popoverTargetProps, ...otherProps } = selectProps;

	const mergedPopoverTargetProps = useMemo(() => ({
		title: selectLabel,
		...popoverTargetProps
	}), [selectLabel, popoverTargetProps]);

	const valueHandler = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => onValueChange(event.target.value), [onValueChange]);

	return <Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<ControlGroup className="zr-text-select-group">
			<BetterSelect
				buttonProps={selectButtonProps}
				onSelect={onSelectChange}
				options={selectOptions}
				popoverTargetProps={mergedPopoverTargetProps}
				value={selectValue}
				{...otherProps}
			/>
			<InputGroup
				aria-label={inputLabel}
				autoComplete="off"
				className={[CustomClasses.INPUT_BOX, CustomClasses.INPUT_TEXT, CustomClasses.TEXT_SMALL].join(" ")}
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


type ToggleProps = {
	description?: ReactNode,
	isChecked: boolean,
	label: string,
	onChange?: FormEventHandler<HTMLInputElement>,
	title?: ReactNode
} & Partial<Omit<SwitchProps, "title">>;

const Toggle = ({ description = null, isChecked, label, onChange = undefined, title = null, ...extraProps }: ToggleProps) => (
	<Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<Switch aria-checked={isChecked} checked={isChecked} aria-label={label} onChange={onChange} role="switch" {...extraProps} />
	</Row>
);


export {
	camelToTitleCase,
	Definition,
	NumericSelect,
	RowCol,
	RowGroup,
	RowGroupOption,
	SingleInput,
	TextAreaInput,
	TextField,
	TextWithSelect,
	Toggle
};