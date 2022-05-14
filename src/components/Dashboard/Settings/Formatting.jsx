import React, { useContext } from "react";
import { Classes, H3 } from "@blueprintjs/core";

import { UserSettings } from "../../App";

function Formatting(){
	const { metadata, notes } = useContext(UserSettings);

	return (
		<>
			<H3>Formatting</H3>
			<div zr-role="settings-formatting">
				<pre className={Classes.CODE_BLOCK}>{JSON.stringify(metadata, null, "\t")}</pre>
				<pre className={Classes.CODE_BLOCK}>{JSON.stringify(notes, null, "\t")}</pre>
			</div>
		</>
	);
}

export default Formatting;