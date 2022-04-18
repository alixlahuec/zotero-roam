import React, { useContext } from "react";
import { func } from "prop-types";
import { Button, Switch } from "@blueprintjs/core";

import Requests from "./Requests";
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
		// sciteBadge, 
		// shortcuts, 
		// typemap, 
		// webimport 
	} = useContext(UserSettings);
    
	return <div className="zr-settings-list">
		<Button icon="cross" minimal={true} onClick={onClose} />
		<Requests />
		<div zr-role="settings-row">
			<span className="zr-auxiliary">Autoload</span>
			<div>
				<Switch checked={autoload == true} readOnly={true} />
			</div>
		</div>
		<div zr-role="settings-row">
			<span className="zr-auxiliary">Render inline citations</span>
			<div>
				<Switch checked={render_inline == true} readOnly={true} />
			</div>
		</div>
	</div>;
}
Settings.propTypes = {
	onClose: func
};

export default Settings;