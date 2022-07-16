import React from "react";
import { bool, func, node, string } from "prop-types";
import { Classes } from "@blueprintjs/core";

import { CustomClasses } from "../../../constants";

function TextField({ disabled = true, label, value, noValue = null, onChange = null }){
	const activeProps = disabled
		? {}
		: { onChange };

	return <div zr-role="settings-row">
		<span className={CustomClasses.TEXT_AUXILIARY}>{label}</span>
		<div zr-role="input-text">
			{value
				? <input 
					autoComplete="off" 
					className={Classes.INPUT} 
					disabled={disabled}
					spellCheck="false" 
					type="text"
					value={value}
					{...activeProps} />
				: noValue
			}
		</div>
	</div>;
}
TextField.propTypes = {
	disabled: bool,
	label: string,
	value: string,
	noValue: node,
	onChange: func
};

export default TextField;