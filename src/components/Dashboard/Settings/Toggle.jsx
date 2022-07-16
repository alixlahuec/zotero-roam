import React from "react";
import { bool, func, string } from "prop-types";
import { Switch } from "@blueprintjs/core";

import { CustomClasses } from "../../../constants";

function Toggle({ disabled = true, isChecked, label, onChange = null }){
	const activeProps = disabled
		? {}
		: { onChange };
	return <div zr-role="settings-row">
		<span className={CustomClasses.TEXT_AUXILIARY}>{label}</span>
		<Switch checked={isChecked} disabled={disabled} {...activeProps} />
	</div>;
}
Toggle.propTypes = {
	disabled: bool,
	isChecked: bool,
	label: string,
	onChange: func
};

export default Toggle;