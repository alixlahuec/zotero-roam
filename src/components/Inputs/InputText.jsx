import React, { useCallback } from "react";
import { func, string } from "prop-types";

import { Icon, InputGroup } from "@blueprintjs/core";


function InputText({ value, setValue }){
	const handleValueChange = useCallback((event) => setValue(event.target.value), [setValue]);
	return <InputGroup 
		className="zr-text-input"
		onChange={handleValueChange} 
		placeholder="Enter text" 
		rightElement={<Icon icon="paragraph" />} 
		value={value} />;
}
InputText.propTypes = {
	value: string,
	setValue: func
};

export default InputText;