import { useCallback } from "react";
import { InputGroup, InputGroupProps2 } from "@blueprintjs/core";
import { CustomClasses } from "../../constants";


interface OwnProps {
	value: InputGroupProps2["value"],
	setValue: (value: string) => void
}

function InputText({ value, setValue }: OwnProps) {
	const handleValueChange = useCallback<NonNullable<InputGroupProps2["onChange"]>>((event) => setValue(event.target.value), [setValue]);
	return <InputGroup 
		className={[CustomClasses.INPUT_BOX, CustomClasses.INPUT_TEXT].join(" ")}
		onChange={handleValueChange} 
		placeholder="Enter text"
		value={value} />;
}

export { InputText };