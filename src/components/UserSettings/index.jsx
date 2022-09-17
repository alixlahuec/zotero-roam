import { bool, func } from "prop-types";

import { Button, Classes } from "@blueprintjs/core";

import AuxiliaryDialog from "Components/AuxiliaryDialog";
import ErrorBoundary from "Components/Errors/ErrorBoundary";

import SettingsPanel from "./Panel";
import UserSettingsProvider from "./Provider";

import { CustomClasses } from "../../constants";

import "./index.css";


function SettingsDialog({ isOpen, onClose }){
	return <AuxiliaryDialog ariaLabelledBy="zr-settings-dialog--title" className="settings" isOpen={isOpen} onClose={onClose}>
		<div className={ Classes.DIALOG_BODY }>
			<ErrorBoundary>
				<div className="header-content">
					<div className="header-left">
						<h5 id="zr-settings-dialog--title" className="panel-tt">
                                Settings for zoteroRoam
						</h5>
					</div>
					<div className={["header-right", CustomClasses.TEXT_AUXILIARY].join(" ")}>
						<Button icon="cross" large={true} minimal={true} onClick={onClose} title="Close dialog" />
					</div>
				</div>
				<div className="rendered-div">
					<SettingsPanel />
				</div>	
			</ErrorBoundary>
		</div>
	</AuxiliaryDialog>;
}
SettingsDialog.propTypes = {
	isOpen: bool,
	onClose: func
};

export {
	SettingsDialog,
	SettingsPanel,
	UserSettingsProvider
};