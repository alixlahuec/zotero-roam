import { ChangeEventHandler, FC, useCallback } from "react";
import { Classes, TextArea, TextAreaProps } from "@blueprintjs/core";

import { CustomClasses } from "../../../constants";


type OwnProps = {
	label?: string,
	onChange: (val: string) => void,
	value: string
};
const TextAreaInput: FC<OwnProps & Partial<TextAreaProps>> = (props) => {
	const { label = undefined, onChange, value, ...extraProps } = props;
	const valueHandler = useCallback<ChangeEventHandler<HTMLTextAreaElement>>((event) => {
		onChange(event.target.value);
	}, [onChange]);

	return <TextArea 
		aria-label={label}
		autoComplete="off" 
		className={["zr-text-input", CustomClasses.TEXT_SMALL, Classes.CODE_BLOCK].join(" ")}
		fill={true}
		growVertically={false}
		onChange={valueHandler}
		spellCheck="false" 
		title={label}
		value={value}
		{...extraProps} />;
};

export { TextAreaInput };