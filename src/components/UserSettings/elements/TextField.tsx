import { ChangeEventHandler, FC, ReactNode, useCallback } from "react";
import { Classes } from "@blueprintjs/core";

import { useBool } from "../../../hooks";
import { Description, Row, Title } from ".";

import { CustomClasses } from "../../../constants";


const TextInput: FC = ({ children }) => <div className="zr-text-input" zr-role="input-text">{children}</div>;

const defaultValidator = (_text: string) => true;
type TextFieldArgs = {
	description?: ReactNode | null,
	ifEmpty?: ReactNode | boolean | null,
	label?: string,
	onChange: (val: string) => void,
	placeholder?: string,
	title?: ReactNode | null,
	validate?: (val: string) => boolean,
	value: string
};
const TextField = ({ description = null, ifEmpty = null, label = undefined, onChange, placeholder = undefined, title = null, validate = defaultValidator, value, ...extraProps }: TextFieldArgs & Record<string, any>) => {
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
					aria-invalid={`${!isValid}`}
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

export { TextField };