import React, { useCallback } from "react";
import { func, string } from "prop-types";
import { Icon, InputGroup } from "@blueprintjs/core";

function InputText({ value, setValue }){
	const handleValueChange = useCallback((event) => setValue(event.target.value), [setValue]);
	return <InputGroup onChange={handleValueChange} rightElement={<Icon icon="paragraph" />} value={value} />;
}
InputText.propTypes = {
	value: string,
	setValue: func
};

export default InputText;