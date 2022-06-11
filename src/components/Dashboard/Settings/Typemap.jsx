import React, { useContext } from "react";
import { H3 } from "@blueprintjs/core";

import TextField from "./TextField";
import { UserSettings } from "../../App";

function Typemap(){
	const { typemap } = useContext(UserSettings);

	return <>
		<H3>Typemap</H3>
		<div zr-role="settings-typemap">
			{Object.keys(typemap).map(itemType => <TextField key={itemType} label={itemType} value={typemap[itemType]} />)}
		</div>
	</>;
}

export default Typemap;