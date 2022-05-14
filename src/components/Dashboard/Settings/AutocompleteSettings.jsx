import React, { useContext } from "react";
import { Classes, H3 } from "@blueprintjs/core";

import { ExtensionContext } from "../../App";

function AutocompleteSettings(){
	const { autocomplete: { trigger, display = "citekey", format = "citation" } } = useContext(ExtensionContext);

	return (
		<>
			<H3>Autocomplete</H3>
			<div zr-role="settings-autocomplete">
				<div zr-role="settings-row">
					<span className="zr-auxiliary">Trigger</span>
					<div>
						{trigger
							? <input className={Classes.INPUT} disabled={true} value={trigger} />
							: <span>No trigger provided</span>}
					</div>
				</div>
				{trigger
					? <>
						<div zr-role="settings-row">
							<span className="zr-auxiliary">In-menu display</span>
							<div>
								<input className={Classes.INPUT} disabled={true} value={display} />
							</div>
						</div>
						<div zr-role="settings-row">
							<span className="zr-auxiliary">Insertion format</span>
							<div>
								<input className={Classes.INPUT} disabled={true} value={format} />
							</div>
						</div>  
					</>
					: null}
			</div>
		</>
	);
}

export default AutocompleteSettings;