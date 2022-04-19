import React, { useContext } from "react";
import { func } from "prop-types";
import { Button, H4, Switch } from "@blueprintjs/core";

import Requests from "./Requests";
import SciteSettings from "./SciteSettings";
import Typemap from "./Typemap";
import { UserSettings } from "../../App";

import "./index.css";

function Settings({ onClose }){
	const { 
		// autocomplete, 
		autoload, 
		// copy, 
		// metadata, 
		// notes, 
		// pageMenu, 
		render_inline, 
		// shortcuts,
		// webimport 
	} = useContext(UserSettings);
    
	return <div className="zr-settings-list">
		<Button icon="cross" minimal={true} onClick={onClose} />
		<Requests />
		<SciteSettings />
		<Typemap />
		<H4>Other</H4>
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
Settings.propTypes = {
	onClose: func
};

export default Settings;