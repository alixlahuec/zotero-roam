import React, { useContext } from "react";
import { Classes, H3, H4 } from "@blueprintjs/core";

import { UserSettings } from "../../App";

function Formatting(){
	const { annotations, metadata, notes } = useContext(UserSettings);

	return (
		<>
			<H3>Formatting</H3>
			<div zr-role="settings-formatting">
				<H4>Metadata</H4>
				<pre className={Classes.CODE_BLOCK}>{JSON.stringify(metadata, null, "\t")}</pre>
				{metadata.use == "function" && metadata.func
					? <pre className={Classes.CODE_BLOCK}>{window[metadata.func].toString()}</pre>
					: null}
				<H4>Notes</H4>
				<pre className={Classes.CODE_BLOCK}>{JSON.stringify(notes, null, "\t")}</pre>
				{notes.func
					? <pre className={Classes.CODE_BLOCK}>{window[notes.func].toString()}</pre>
					: null}
				<H4>Annotations</H4>
				<pre className={Classes.CODE_BLOCK}>{JSON.stringify(annotations, null, "\t")}</pre>
			</div>
		</>
	);
}

export default Formatting;