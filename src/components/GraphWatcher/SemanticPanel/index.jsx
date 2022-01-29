import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, Classes, Icon, Tab, Tabs } from "@blueprintjs/core";

import AuxiliaryDialog from "../AuxiliaryDialog";
import SemanticQuery from "./SemanticQuery";
import SidePanel from "./SidePanel";

import { pluralize, sortElems } from "../../../utils";
import * as customPropTypes from "../../../propTypes";
import "./index.css";

const labelId = "zr-semantic-panel-label";

const SemanticTabList = React.memo(function SemanticTabList(props) {
	const { defaultTab, items, metadataSettings, onClose, selectProps, title } = props;
	const [isActiveTab, setActiveTab] = useState(defaultTab);
	
	useEffect(() => {
		setActiveTab(defaultTab);
	}, [defaultTab]);

	const selectTab = useCallback((newtab, _prevtab, _event) => {
		setActiveTab(newtab);
	}, []);

	const references = useMemo(() =>  sortElems(items.references, "year"), [items.references]);

	const citations = useMemo(() => sortElems(items.citations, "year"), [items.citations]);

	const references_title = useMemo(() => {
		return (
			<>
				<Icon icon="citation" />
				<span>{pluralize(references.length, "reference")}</span>
			</>
		);
	}, [references.length]);

	const citations_title = useMemo(() => {
		return (
			<>
				<Icon icon="chat" />
				<span>{pluralize(citations.length, "citing paper")}</span>
			</>
		);
	}, [citations.length]);

	return (
		<Tabs id="zr-semantic-panel" selectedTabId={isActiveTab} onChange={selectTab} animate={false}>
			<Tab id="is_reference" 
				panel={<SemanticQuery
					items={references}
					metadataSettings={metadataSettings}
					selectProps={selectProps}
					type="is_reference"
				/>} 
				disabled={references.length == 0}
				title={references_title}
			/>
			<Tab id="is_citation" 
				panel={<SemanticQuery
					items={citations}
					metadataSettings={metadataSettings}
					selectProps={selectProps}
					type="is_citation"
				/>}
				disabled={citations.length == 0}
				title={citations_title}
			/>
			<Tabs.Expander />
			<span className="zr-auxiliary" id={labelId}>{title}</span>
			<Button icon="cross" minimal={true} large={true} onClick={onClose} />
		</Tabs>
	);
});
SemanticTabList.propTypes = {
	defaultTab: PropTypes.string,
	items: PropTypes.arrayOf(customPropTypes.cleanSemanticReturnType),
	metadataSettings: PropTypes.object,
	onClose: PropTypes.func,
	selectProps: PropTypes.shape({
		handleRemove: PropTypes.func,
		handleSelect: PropTypes.func,
		items: PropTypes.arrayOf(customPropTypes.cleanSemanticReturnType),
		resetImport: PropTypes.func
	}),
	title: PropTypes.string
};

const SemanticPanel = React.memo(function SemanticPanel(props){
	const { isOpen, items, libraries, metadataSettings, onClose, portalId, show } = props;
	const [itemsForImport, setItemsForImport] = useState([]);

	const has_selected_items = itemsForImport.length > 0;

	const addToImport = useCallback((item) => {
		setItemsForImport(prevItems => {
			let match = prevItems.find(i => i.doi == item.doi && i.url == item.url);
			if(match){
				return prevItems;
			} else {
				return [...prevItems, item];
			}
		});
	}, []);

	const removeFromImport = useCallback((item) => {
		setItemsForImport(prevItems => prevItems.filter(i => i.doi != item.doi && i.url != item.url));
	}, []);

	const resetImport = useCallback(() => {
		setItemsForImport([]);
	}, []);

	const selectProps = useMemo(() => {
		return {
			handleRemove: removeFromImport,
			handleSelect: addToImport,
			items: itemsForImport,
			resetImport
		};
	}, [addToImport, itemsForImport, removeFromImport, resetImport]);

	return (
		<AuxiliaryDialog
			ariaLabelledBy={labelId}
			className="citations"
			extraClasses={has_selected_items ? ["has-selected-items"] : []}
			isOpen={isOpen}
			onClose={onClose}
			portalId={portalId}
		>
			<div className={ Classes.DIALOG_BODY }>
				<div className="zr-semantic-panel--main">
					<SemanticTabList 
						defaultTab={show.type}
						items={items}
						metadataSettings={metadataSettings}
						onClose={onClose}
						selectProps={selectProps}
						title={show.title}
					/>
				</div>
				<SidePanel libraries={libraries} selectProps={selectProps} />
			</div>
		</AuxiliaryDialog>
	);
});
SemanticPanel.propTypes = {
	isOpen: PropTypes.bool,
	items: PropTypes.arrayOf(customPropTypes.cleanSemanticReturnType),
	libraries: PropTypes.arrayOf(PropTypes.shape({
		apikey: PropTypes.string,
		path: PropTypes.string
	})),
	metadataSettings: PropTypes.object,
	onClose: PropTypes.func,
	portalId: PropTypes.string,
	show: PropTypes.shape({
		title: PropTypes.string,
		type: PropTypes.oneOf(["is_citation", "is_reference"])
	})
};

export default SemanticPanel;
