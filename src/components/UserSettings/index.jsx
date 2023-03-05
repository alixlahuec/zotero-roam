import { bool, func } from "prop-types";

import { Classes, Tab, Tabs } from "@blueprintjs/core";

import AuxiliaryDialog from "Components/AuxiliaryDialog";
import ButtonLink from "Components/ButtonLink";
import ErrorBoundary from "Components/Errors/ErrorBoundary";
import UserSettingsProvider from "./Provider";

import { CustomClasses } from "../../constants";
import { SETTINGS_CONFIG } from "./mapping";
import { camelToTitleCase } from "../../utils";

import "./index.css";


const tabProps = {
	className: "zr-settings-tab",
	panelClassName: "zr-settings-panel"
};

function SettingsDialog({ isOpen, onClose }){
	return <AuxiliaryDialog className="settings" isOpen={isOpen} label="zoteroRoam settings" onClose={onClose}>
		<div className={ Classes.DIALOG_BODY }>
			<div className="zr-settings--main">
				<Tabs animate={false} className={[CustomClasses.TABS, "zr-settings-tabs-wrapper"].join(" ")} id="zr-settings--tabs" vertical={true}>
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
								title={camelToTitleCase(id)}
								{...tabProps}
							/>;
						})
					}
					<Tabs.Expander />
					<ButtonLink active={true} fill={true} href="https://alix-lahuec.gitbook.io/zotero-roam/customization/user-settings" intent="primary" rightIcon="document-open" text="Docs" />
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