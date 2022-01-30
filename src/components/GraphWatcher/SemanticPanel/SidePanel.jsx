import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { Button, ButtonGroup, Classes } from "@blueprintjs/core";

import ZoteroImport from "../../ZoteroImport";

import * as customPropTypes from "../../../propTypes";

const SelectedImportItem = React.memo(function SelectedImportItem(props) {
	const { handleRemove, item } = props;

	const removeItemFromImport = useCallback(() => {
		handleRemove(item);
	}, [handleRemove, item]);

	return (
		<li className={["import-items_selected", "zr-text-small"].join(" ")}>
			<div className="selected_info">
				<span className={[Classes.TEXT_MUTED, "selected_title"].join(" ")}>{item.title}</span>
				<span className="selected_origin">{item.meta}</span>
			</div>
			<div className="selected_state">
				<ButtonGroup minimal={true} small={true}>
					<Button className="selected_remove-button" icon="cross" intent="danger" onClick={removeItemFromImport} />
				</ButtonGroup>
			</div>
		</li>
	);
});
SelectedImportItem.propTypes = {
	handleRemove: PropTypes.func,
	item: customPropTypes.cleanSemanticReturnType
};

const SidePanel = React.memo(function SidePanel(props) {
	const { libraries, selectProps } = props;
	const { handleRemove } = selectProps;

	return (
		<div className="zr-semantic-panel--side">
			<ZoteroImport libraries={libraries} selectProps={selectProps} />
			<ul className={[Classes.LIST_UNSTYLED, "import-items"].join(" ")}>
				{selectProps.items.map(item => <SelectedImportItem key={[item.doi, item.url].join("-")} handleRemove={handleRemove} item={item} />)}
			</ul>
		</div>
	);
});
SidePanel.propTypes = {
	libraries: PropTypes.arrayOf(PropTypes.shape({
		apikey: PropTypes.string,
		path: PropTypes.string
	})),
	selectProps: PropTypes.shape({
		handleRemove: PropTypes.func,
		handleSelect: PropTypes.func,
		items: PropTypes.arrayOf(customPropTypes.cleanSemanticReturnType),
		resetImport: PropTypes.func
	})
};

export default SidePanel;
