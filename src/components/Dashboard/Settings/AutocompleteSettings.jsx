import React, { useContext } from "react";
import { H3 } from "@blueprintjs/core";

import TextField from "./TextField";
import { UserSettings } from "../../App";

function AutocompleteSettings(){
	const { autocomplete: { trigger, display = "citekey", format = "citation" } } = useContext(UserSettings);

	return (
		<>
			<H3>Autocomplete</H3>
			<div zr-role="settings-autocomplete">
				<TextField label="Trigger" value={trigger} noValue={<span>No trigger provided</span>} />
				{trigger
					? <>
						<TextField label="In-menu display" value={display} />
						<TextField label="Insertion format" value={format} />
					</>
					: null}
			</div>
		</>
	);
}

export default AutocompleteSettings;