import { bool, func } from "prop-types";

import { Button, Classes, Tab, Tabs } from "@blueprintjs/core";

import AuxiliaryDialog from "Components/AuxiliaryDialog";
import UserSettingsProvider from "./Provider";

import { CustomClasses } from "../../constants";
import { SETTINGS_CONFIG } from "./mapping";
import { camelToTitleCase } from "../../utils";

import "./index.css";
import ErrorBoundary from "Components/Errors/ErrorBoundary";


function SettingsDialog({ isOpen, onClose }){
	return <AuxiliaryDialog className="settings" isOpen={isOpen} label="zoteroRoam settings" onClose={onClose}>
		<div className={ Classes.DIALOG_BODY }>
			<div className="zr-settings--main">
				<Tabs animate={false} className={CustomClasses.TABS} id="zr-settings--tabs" vertical={true}>
					{SETTINGS_CONFIG
						.filter(entry => entry.widget)
						.map(entry => {
							const { id, widget: Comp } = entry;

							return <Tab 
								key={id}
								id={id}
								panel={<ErrorBoundary>
									<Comp />
								</ErrorBoundary>}
								panelClassName="zr-settings-panel"
								title={camelToTitleCase(id)}
							/>;
						})
					}
					<Tabs.Expander />
					<Button active={true} fill={true} intent="primary" minimal={true} rightIcon="document-open"><b>Docs</b></Button>
				</Tabs>
			</div>
		</div>
	</AuxiliaryDialog>;
}
SettingsDialog.propTypes = {
	isOpen: bool,
	onClose: func
};

export {
	SettingsDialog,
	UserSettingsProvider
};