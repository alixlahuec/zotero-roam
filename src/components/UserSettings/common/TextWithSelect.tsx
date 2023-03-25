import { ChangeEventHandler, FC, HTMLAttributes, ReactNode, useCallback, useMemo } from "react";
import { ButtonProps, ControlGroup, InputGroup, InputGroupProps } from "@blueprintjs/core";
import { SelectProps } from "@blueprintjs/select";

import { BetterSelect, Description, Row, Title } from ".";
import { CustomClasses } from "../../../constants";


type Option = { label: string, value: string | boolean };

type OwnProps = {
	description?: ReactNode | null,
	onSelectChange: (val: string | boolean) => void,
	onValueChange: (val: string) => void,
	placeholder?: string,
	selectOptions: { label: string, value: string | boolean}[],
	selectValue: string | boolean,
	textValue: string,
	title?: ReactNode | null,
	inputGroupProps?: Partial<InputGroupProps>,
	inputLabel: string,
	selectButtonProps?: Partial<ButtonProps>,
	selectProps?: {
		popoverTargetProps?: HTMLAttributes<HTMLElement>
	} & Partial<SelectProps<Option>>,
	selectLabel: string
};

const TextWithSelect: FC<OwnProps> = ({ description = null, onSelectChange, onValueChange, placeholder = undefined, selectOptions, selectValue, textValue, title = null, inputGroupProps = {}, inputLabel, selectButtonProps = {}, selectProps = {}, selectLabel }) => {
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

export { TextWithSelect };