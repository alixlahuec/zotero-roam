import React, { useContext } from "react";
import { H3, Switch } from "@blueprintjs/core";

import Requests from "./Requests";
import SciteSettings from "./SciteSettings";
import Typemap from "./Typemap";
import { UserSettings } from "../../App";

import "./index.css";
import Formatting from "./Formatting";
import AutocompleteSettings from "./AutocompleteSettings";

function Settings(){
	const {
		autoload, 
		// copy,
		// pageMenu, 
		render_inline, 
		// shortcuts,
		// webimport 
	} = useContext(UserSettings);
    
	return <div className="zr-settings-list">
		<Requests />
		<Formatting />
		<AutocompleteSettings />
		<SciteSettings />
		<Typemap />
		<H3>Other</H3>
		<div zr-role="settings-row">
			<span className="zr-auxiliary">Autoload</span>
			<Switch checked={autoload == true} disabled={true} />
		</div>
		<div zr-role="settings-row">
			<span className="zr-auxiliary">Render inline citations</span>
			<Switch checked={render_inline == true} disabled={true} />
		</div>
	</div>;
}

export default Settings;