import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Classes, Icon, Tab, Tabs } from "@blueprintjs/core";

import AuxiliaryDialog from "Components/AuxiliaryDialog";
import { ErrorBoundary } from "Components/Errors";
import SemanticPagination, { SemanticPaginationProps } from "./SemanticPagination";
import SidePanel from "./SidePanel";

import { useMulti } from "@hooks";

import { sortElems } from "../helpers";
import { ShowTypeSemantic } from "../types";

import { CustomClasses } from "../../../constants";
import { pluralize } from "../../../utils";
import { SEnrichedItem, SRelatedEntries } from "Types/transforms";
import "./_index.sass";


const labelId = "zr-semantic-panel-label";

type SemanticTabListProps = {
	defaultTab: ShowTypeSemantic,
	items: SRelatedEntries,
	onClose: () => void,
	selectProps: SemanticPaginationProps["selectProps"],
	title: string
};

const SemanticTabList = memo<SemanticTabListProps>(function SemanticTabList(props) {
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
		<Tabs id="zr-semantic-panel" className={CustomClasses.TABS} selectedTabId={isActiveTab} onChange={selectTab} animate={false}>
			<Tab id={ShowTypeSemantic.REFERENCES} 
				panel={<SemanticPagination
					items={references}
					selectProps={selectProps}
					type={ShowTypeSemantic.REFERENCES}
				/>} 
				disabled={references.length == 0}
				title={references_title}
			/>
			<Tab id={ShowTypeSemantic.CITATIONS}
				panel={<SemanticPagination
					items={citations}
					selectProps={selectProps}
					type={ShowTypeSemantic.CITATIONS}
				/>}
				disabled={citations.length == 0}
				title={citations_title}
			/>
			<Tabs.Expander />
			<span className={CustomClasses.TEXT_AUXILIARY}
				id={labelId}
				aria-label={"Works related to " + title}
				title={"Works related to " + title}>
				{title}
			</span>
			<Button icon="cross" minimal={true} large={true} onClick={onClose} title="Close dialog" />
		</Tabs>
	);
});


type SemanticPanelProps = {
	isOpen: boolean,
	items: SRelatedEntries,
	onClose: () => void,
	show: {
		title: string,
		type: ShowTypeSemantic
	}
};

const SemanticPanel = memo<SemanticPanelProps>(function SemanticPanel(props){
	const { isOpen, items, onClose, show } = props;
	const [itemsForImport, { set: setItemsForImport, add: addToImport, remove: removeFromImport }] = useMulti<SEnrichedItem>({
		start: [],
		identify: (item, value) => item.doi == value.doi && item.url == value.url
	});

	const has_selected_items = itemsForImport.length > 0;

	const selectProps = useMemo(() => {
		return {
			handleRemove: removeFromImport,
			handleSelect: addToImport,
			items: itemsForImport,
			resetImport: () => setItemsForImport([])
		};
	}, [addToImport, itemsForImport, removeFromImport, setItemsForImport]);

	const handleClose = useCallback(() => {
		setItemsForImport([]);
		onClose();
	}, [onClose, setItemsForImport]);

	return (
		<AuxiliaryDialog
			ariaLabelledBy={labelId}
			className="citations"
			extraClasses={has_selected_items ? ["has-selected-items"] : []}
			isOpen={isOpen}
			onClose={handleClose}
		>
			<div className={ Classes.DIALOG_BODY }>
				<ErrorBoundary>
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
				</ErrorBoundary>
			</div>
		</AuxiliaryDialog>
	);
});


export default SemanticPanel;
