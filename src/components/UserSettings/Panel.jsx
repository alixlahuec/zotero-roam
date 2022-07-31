import React from "react";

import { H3 } from "@blueprintjs/core";

import { SETTINGS_CONFIG } from "./mapping";

import "./Panel.css";


// https://stackoverflow.com/questions/7225407/convert-camelcasetext-to-title-case-text
const camelToTitleCase = (text) => {
	const result = text.replace(/([A-Z])/g, " $1");
	const finalResult = result.charAt(0).toUpperCase() + result.slice(1);

	return finalResult;
};

function SettingsPanel() {
	return <div className="zr-settings-list">
		{SETTINGS_CONFIG
			.filter(entry => entry.widget)
			.map(entry => {
				const { id, widget: Comp } = entry;
				return <React.Fragment key={id}>
					<H3>{camelToTitleCase(id)}</H3>
					<Comp />
				</React.Fragment>;
			})
		}
	</div>;
}

export default SettingsPanel;