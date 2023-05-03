import { useCallback } from "react";
import { InputGroup, InputGroupProps2 } from "@blueprintjs/core";


interface OwnProps {
	value: InputGroupProps2["value"],
	setValue: (value: string) => void
}

function InputText({ value, setValue }: OwnProps) {
	const handleValueChange = useCallback<NonNullable<InputGroupProps2["onChange"]>>((event) => setValue(event.target.value), [setValue]);
	return <InputGroup 
		className="zr-text-input"
		onChange={handleValueChange} 
		placeholder="Enter text"
		value={value} />;
}

export { InputText };