import React, { useContext } from "react";
import { H3 } from "@blueprintjs/core";

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
    
	return <SentryBoundary feature="extension-settings">
		<div className="zr-settings-list">
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
		</div>
	</SentryBoundary>;
}

export default Settings;