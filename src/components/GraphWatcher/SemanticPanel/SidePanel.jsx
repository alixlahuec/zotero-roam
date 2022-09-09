import { arrayOf, func, shape } from "prop-types";
import { memo, useCallback, useMemo } from "react";

import { Button, ButtonGroup, Classes } from "@blueprintjs/core";

import ZoteroImport from "Components/ZoteroImport";

import * as customPropTypes from "../../../propTypes";
import { CustomClasses } from "../../../constants";


const SelectedImportItem = memo(function SelectedImportItem(props) {
	const { handleRemove, item } = props;

	const removeItemFromImport = useCallback(() => {
		handleRemove(item);
	}, [handleRemove, item]);

	return (
		<li className={["import-items_selected", CustomClasses.TEXT_SMALL].join(" ")}>
			<div className="selected_info">
				<span className={[Classes.TEXT_MUTED, "selected_title"].join(" ")}>{item.title}</span>
				<span className={[CustomClasses.TEXT_SECONDARY, "selected_origin"].join(" ")}>{item.meta}</span>
			</div>
			<div className="selected_state">
				<ButtonGroup minimal={true} >
					<Button className="selected_remove-button" icon="cross" intent="danger" onClick={removeItemFromImport} title="Remove item from import" />
				</ButtonGroup>
			</div>
		</li>
	);
});
SelectedImportItem.propTypes = {
	handleRemove: func,
	item: customPropTypes.cleanSemanticReturnType
};

const SidePanel = memo(function SidePanel({ selectProps }) {
	const { handleRemove, items, resetImport } = selectProps;

	const importActive = items.length > 0;

	const identifiers = useMemo(() => {
		return items.map(it => it.doi ? ("https://doi.org/" + it.doi) : it.url);
	}, [items]);

	return (
		<div className="zr-semantic-panel--side" tabIndex={0}>
			<ZoteroImport identifiers={identifiers} isActive={importActive} resetImport={resetImport} />
			<ul className={[Classes.LIST_UNSTYLED, "import-items"].join(" ")}>
				{selectProps.items.map(item => <SelectedImportItem key={[item.doi, item.url].join("-")} handleRemove={handleRemove} item={item} />)}
			</ul>
		</div>
	);
});
SidePanel.propTypes = {
	selectProps: shape({
		handleRemove: func,
		handleSelect: func,
		items: arrayOf(customPropTypes.cleanSemanticReturnType),
		resetImport: func
	})
};

export default SidePanel;
