import React, { useCallback, useMemo } from "react";
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
				<span className={["zr-secondary", "selected_origin"].join(" ")}>{item.meta}</span>
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
	const { selectProps } = props;
	const { handleRemove } = selectProps;

	const identifiers = useMemo(() => {
		return selectProps.items.map(it => it.doi ? ("https://doi.org/" + it.doi) : it.url);
	}, [selectProps.items]);

	return (
		<div className="zr-semantic-panel--side">
			<ZoteroImport identifiers={identifiers} selectProps={selectProps} />
			<ul className={[Classes.LIST_UNSTYLED, "import-items"].join(" ")}>
				{selectProps.items.map(item => <SelectedImportItem key={[item.doi, item.url].join("-")} handleRemove={handleRemove} item={item} />)}
			</ul>
		</div>
	);
});
SidePanel.propTypes = {
	selectProps: PropTypes.shape({
		handleRemove: PropTypes.func,
		handleSelect: PropTypes.func,
		items: PropTypes.arrayOf(customPropTypes.cleanSemanticReturnType),
		resetImport: PropTypes.func
	})
};

export default SidePanel;
