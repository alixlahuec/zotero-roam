import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Checkbox, Classes, Spinner } from "@blueprintjs/core";

import AuxiliaryDialog from "../AuxiliaryDialog";

import { useQuery_Citoid } from "../../../api/queries";
import { pluralize } from "../../../utils";

function useGetCitoids(urls, opts = {}) {
	return useQuery_Citoid(urls, {
		...opts,
		select: (data) => {
			const { item, query } = data;
			const { 
				abstractNote: abstract = "", 
				itemType, 
				title = "" } = item.data;

			return {
				abstract,
				creators: item.data.creators.map(cre => cre.name || [cre.firstName, cre.lastName].filter(Boolean).join(" ")).join(", "),
				itemType, 
				publication: item.data.publicationTitle || item.data.bookTitle || item.data.websiteTitle || "",
				title,
				url: query
			};
		},
		notifyOnChangeProps: ["data"]
	});
}

const WebImportItem = React.memo(function WebImportItem(props){
	const { isSelected, item, onSelect } = props;

	const handleCheckUncheck = useCallback(() => {
		onSelect(item.url);
	}, [item.url, onSelect]);
    
	return (
		<li className="zr-webimport-item" data-item-type={item.itemType}>
			<div className={ Classes.MENU_ITEM } label={item.url}>
				<Checkbox
					checked={isSelected}
					className="zr-webimport-item--title"
					defaultChecked={true}
					inline={false}
					labelElement={<a target="_blank" rel="noreferrer" href={item.url}>item.title</a>}
					onChange={handleCheckUncheck}
				/>
				<div className={[ Classes.TEXT_OVERFLOW_ELLIPSIS, Classes.FILL, "zr-webimport-item--contents" ].join(" ")}>
					<span className="zr-explo-metadata">
						{[item.itemType, item.creators].join(" | ")}
					</span>
					{item.publication 
						? <span className={["zr-webimport-item--publication", "zr-text-small", "zr-auxiliary"].join(" ")}>{item.publication}</span> 
						: null}
					<span className={["zr-webimport-item--abstract", "zr-text-small", "zr-secondary"].join(" ")}>
						{item.abstract}
					</span>
				</div>
			</div>
		</li>
	);
});
WebImportItem.propTypes = {
	isSelected: PropTypes.bool,
	item: PropTypes.object,
	onSelect: PropTypes.func
};

const WebImportPanel = React.memo(function WebImportPanel(props){
	const { isOpen, onClose, urls } = props;
	const [selected, setSelected] = useState(urls);

	const citoidQueries = useGetCitoids(urls, { enabled: isOpen });
	const isDataReady = citoidQueries.every(q => q.data);
	const citoids = citoidQueries.map(q => q.data).filter(Boolean);

	const handleItemSelection = useCallback((url) => {
		setSelected(currentSelection => {
			if(currentSelection.includes(url)){
				return currentSelection.filter(u => u != url);
			} else {
				return [...currentSelection, url];
			}
		});
	}, []);

	return (
		<AuxiliaryDialog
			ariaLabelledBy="zr-webimport-dialog--title"
			isOpen={isOpen}
			onClose={onClose} >
			<div className={ Classes.DIALOG_BODY }>
				<div className="header-content">
					<div className="header-left">
						<h5 id="zr-webimport-dialog--title" className="panel-tt">
							{isDataReady
								? pluralize(citoids.length, "link", " found")
								: "Parsing links..."}
						</h5>
						{!isDataReady ? <Spinner value={citoids.length / urls.length} /> : null}
					</div>
				</div>
				<div className="rendered-div">
					<ul className={ Classes.LIST_UNSTYLED }>
						{citoids.map(cit => <WebImportItem key={cit.query} item={cit.item} isSelected={selected.includes(cit.query)} onSelect={handleItemSelection} />)}
					</ul>
				</div>
			</div>
		</AuxiliaryDialog>
	);
});
WebImportPanel.propTypes = {
	isOpen: PropTypes.bool,
	onClose: PropTypes.func,
	urls: PropTypes.arrayOf(PropTypes.string)
};

export default WebImportPanel;
