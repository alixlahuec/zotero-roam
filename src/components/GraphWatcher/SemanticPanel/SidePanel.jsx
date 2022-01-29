import React from "react";
import PropTypes from "prop-types";
import { Button, ButtonGroup, Classes } from "@blueprintjs/core";

import * as customPropTypes from "../../../propTypes";

const SidePanel = React.memo(function SidePanel(props) {
	const { items } = props;

	if(items.length == 0) {
		return null;
	} else {
		return (
			<div className="zr-semantic-panel--side">
				<ul className={[Classes.LIST_UNSTYLED, "import-items"].join(" ")}>
					{items.map(item => {
						return (
							<li className="import-items_selected" key={[item.doi, item.url].join("-")}>
								<div className="selected_info">
									<span className={[Classes.TEXT_MUTED, "selected_title"].join(" ")}>{item.title}</span>
									<span className="selected_origin">{item.meta}</span>
								</div>
								<div className="selected_state">
									<ButtonGroup minimal={true} small={true}>
										<Button className="selected_remove-button" icon="cross" intent="danger" />
									</ButtonGroup>
								</div>
							</li>
						);
					})}
				</ul>
			</div>
		);
	}
});
SidePanel.propTypes = {
	items: PropTypes.arrayOf(customPropTypes.cleanSemanticReturnType)
};

export default SidePanel;
