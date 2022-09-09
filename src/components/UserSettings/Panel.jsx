import { Fragment } from "react";
import { H3 } from "@blueprintjs/core";

import { SETTINGS_CONFIG } from "./mapping";
import { camelToTitleCase } from "../../utils";

import "./Panel.css";


function SettingsPanel() {
	return (
		<div className="zr-settings-list">
			{SETTINGS_CONFIG
				.filter(entry => entry.widget)
				.map(entry => {
					const { id, widget: Comp } = entry;
					return (
						<Fragment key={id}>
							<H3>{camelToTitleCase(id)}</H3>
							<Comp />
						</Fragment>
					);
				})
			}
		</div>
	);
}

export default SettingsPanel;