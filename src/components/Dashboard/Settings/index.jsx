import React, { useContext } from "react";
import { Button, H3 } from "@blueprintjs/core";

import AutocompleteSettings from "./AutocompleteSettings";
import Formatting from "./Formatting";
import PageMenuSettings from "./PageMenuSettings";
import Requests from "./Requests";
import SciteSettings from "./SciteSettings";
import SentryBoundary from "../../Errors/SentryBoundary";
import Shortcuts from "./ShortcutsSettings";
import Toggle from "./Toggle";
import Typemap from "./Typemap";
import { UserSettings } from "../../App";

import "./index.css";

function Settings(){
	const {
		autoload, 
		// copy,
		render_inline, 
		// webimport 
	} = useContext(UserSettings);
    
	return <div className="zr-settings-list">
		<SentryBoundary>
			<Button minimal={true} onClick={window.executeUnknownFunction} text="Collapse all" />
		</SentryBoundary>
		<Requests />
		<Formatting />
		<AutocompleteSettings />
		<PageMenuSettings />
		<SciteSettings />
		<Shortcuts />
		<Typemap />
		<H3>Other</H3>
		<Toggle isChecked={autoload == true} label="Autoload" />
		<Toggle isChecked={render_inline == true} label="Render inline citations" />
	</div>;
}

export default Settings;