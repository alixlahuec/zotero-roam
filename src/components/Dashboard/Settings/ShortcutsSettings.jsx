import React, { useContext } from "react";
import { H3 } from "@blueprintjs/core";

import TextField from "./TextField";
import { UserSettings } from "../../App";

function Shortcuts(){
	const { shortcuts } = useContext(UserSettings);

	return <>
		<H3>Shortcuts</H3>
		<div zr-role="settings-shortcuts">
			{Object.keys(shortcuts).map(action => <TextField key={action} label={action} value={shortcuts[action] || ""} />)}
		</div>
	</>;
}

export default Shortcuts;