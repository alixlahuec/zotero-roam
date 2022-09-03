import { func, string } from "prop-types";
import { useCallback } from "react";

import { InputGroup } from "@blueprintjs/core";


function InputText({ value, setValue }){
	const handleValueChange = useCallback((event) => setValue(event.target.value), [setValue]);
	return <InputGroup 
		className="zr-text-input"
		onChange={handleValueChange} 
		placeholder="Enter text"
		value={value} />;
}
InputText.propTypes = {
	value: string,
	setValue: func
};

export default InputText;