import React, { useCallback, useEffect, useMemo, useState } from "react";
import { arrayOf, bool, func, oneOf, shape, string } from "prop-types";
import { Button, Classes, Icon, Tab, Tabs } from "@blueprintjs/core";

import AuxiliaryDialog from "../../AuxiliaryDialog";
import SemanticPagination from "./SemanticPagination";
import SidePanel from "./SidePanel";

import { pluralize, sortElems } from "../../../utils";
import * as customPropTypes from "../../../propTypes";
import "./index.css";

const labelId = "zr-semantic-panel-label";

const SemanticTabList = React.memo(function SemanticTabList(props) {
	const { defaultTab, items, onClose, selectProps, title } = props;
	const [isActiveTab, setActiveTab] = useState(defaultTab);
	
	useEffect(() => {
		setActiveTab(defaultTab);
	}, [defaultTab]);

	const selectTab = useCallback((newtab, _prevtab, _event) => setActiveTab(newtab), []);

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
				panel={<SemanticPagination
					items={references}
					selectProps={selectProps}
					type="is_reference"
				/>} 
				disabled={references.length == 0}
				title={references_title}
			/>
			<Tab id="is_citation" 
				panel={<SemanticPagination
					items={citations}
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
	defaultTab: string,
	items: arrayOf(customPropTypes.cleanSemanticReturnType),
	onClose: func,
	selectProps: shape({
		handleRemove: func,
		handleSelect: func,
		items: arrayOf(customPropTypes.cleanSemanticReturnType),
		resetImport: func
	}),
	title: string
};

const SemanticPanel = React.memo(function SemanticPanel(props){
	const { isOpen, items, onClose, show } = props;
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

	const handleClose = useCallback(() => {
		resetImport();
		onClose();
	}, [onClose, resetImport]);

	return (
		<AuxiliaryDialog
			ariaLabelledBy={labelId}
			className="citations"
			extraClasses={has_selected_items ? ["has-selected-items"] : []}
			isOpen={isOpen}
			onClose={handleClose}
		>
			<div className={ Classes.DIALOG_BODY }>
				<div className="zr-semantic-panel--main">
					<SemanticTabList 
						defaultTab={show.type}
						items={items}
						onClose={handleClose}
						selectProps={selectProps}
						title={show.title}
					/>
				</div>
				<SidePanel selectProps={selectProps} />
			</div>
		</AuxiliaryDialog>
	);
});
SemanticPanel.propTypes = {
	isOpen: bool,
	items: arrayOf(customPropTypes.cleanSemanticReturnType),
	onClose: func,
	show: shape({
		title: string,
		type: oneOf(["is_citation", "is_reference"])
	})
};

export default SemanticPanel;
