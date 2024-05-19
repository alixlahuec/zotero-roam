import { memo, useEffect, useMemo } from "react";
import { Button, Classes } from "@blueprintjs/core";

import AuxiliaryDialog from "Components/AuxiliaryDialog";
import CitekeyPopover from "Components/CitekeyPopover";
import { ErrorBoundary } from "Components/Errors";

import { useBool } from "@hooks";

import { sortElems } from "../helpers";
import { ShowPropertiesRelated, ShowTypeRelated } from "../types";

import { CustomClasses } from "../../../constants";
import { pluralize } from "../../../utils";
import { SCleanRelatedItem } from "Types/transforms";
import "./_index.sass";


const PANEL_LABEL_ID = "zr-related-panel-label";

type AbstractProps = {
	abstract: string,
	allAbstractsShown: boolean
};

const Abstract = memo<AbstractProps>(function Abstract({ abstract, allAbstractsShown }) {
	const [isVisible, { set: setVisible, toggle: toggleAbstract }] = useBool(allAbstractsShown);

	useEffect(() => {
		setVisible(allAbstractsShown);
	}, [allAbstractsShown, setVisible]);

	if(!abstract){
		return null;
	} else {
		return (
			<div className="zr-related-item--abstract">
				<Button className={CustomClasses.TEXT_SMALL}
					zr-role="abstract-toggle"
					icon={isVisible ? "chevron-down" : "chevron-right"}
					onClick={toggleAbstract}
					minimal={true} 
					small={true} >
					Abstract
				</Button>
				{isVisible
					? <span zr-role="abstract-text" className={[CustomClasses.TEXT_SMALL, CustomClasses.TEXT_AUXILIARY].join(" ")}>{abstract}</span>
					: null}
			</div>
		);
	}
});


type TimestampProps = {
	timestamp: string,
	type: ShowTypeRelated
};

const Timestamp = memo<TimestampProps>(function Timestamp({ timestamp, type }){
	return type == "added_on"
		? <span className={[Classes.MENU_ITEM_LABEL, CustomClasses.TEXT_SMALL, "zr-related-item--timestamp"].join(" ")}>
			{timestamp}
		</span>
		: null;
});


type RelatedItemProps = {
	allAbstractsShown: boolean,
	closeDialog: () => void,
	item: SCleanRelatedItem,
	type: ShowTypeRelated
};

const RelatedItem = memo<RelatedItemProps>(function RelatedItem(props) {
	const { allAbstractsShown, closeDialog, item, type } = props;
	const { children: { pdfs, notes }, raw } = item;

	return (
		<li className="zr-related-item" data-in-graph={(item.inGraph != false).toString()}>
			<div className={ Classes.MENU_ITEM }>
				<Timestamp timestamp={item.timestamp} type={type} />
				<div className={[Classes.FILL, "zr-related-item-contents"].join(" ")}>
					<div className={ Classes.FILL } style={{ display: "flex" }}>
						<div className="zr-related-item-contents--metadata" >
							<span className="zr-related-item--title" data-item-type={item.itemType}>{item.title}</span>
							<span className={CustomClasses.TEXT_ACCENT_1}>{item.meta}</span>
						</div>
						<span className="zr-related-item-contents--actions">
							<CitekeyPopover 
								closeDialog={closeDialog} 
								inGraph={item.inGraph} 
								item={raw}
								notes={notes} 
								pdfs={pdfs} />
						</span>
					</div>
					<Abstract abstract={item.abstract} allAbstractsShown={allAbstractsShown} />
				</div>
			</div>
		</li>
	);
});


type RelatedListProps = {
	items: SCleanRelatedItem[]
} & Omit<RelatedItemProps, "item">;

const RelatedList = memo<RelatedListProps>(function RelatedList(props) {
	const { allAbstractsShown, closeDialog, items, type } = props;

	const sortedItems = useMemo(() => {
		const sort = type == ShowTypeRelated.ADDED_ON ? "added" : "meta";
		return sortElems(items, sort);
	}, [items, type]);

	return (
		<ul className={Classes.LIST_UNSTYLED}>
			{sortedItems.map(it => (
				<RelatedItem key={[it.location, it.key].join("-")} 
					allAbstractsShown={allAbstractsShown} 
					closeDialog={closeDialog}
					item={it}
					type={type} />
			))}
		</ul>
	);
});


type RelatedPanelProps = {
	isOpen: boolean,
	items: SCleanRelatedItem[],
	onClose: () => void,
	show: ShowPropertiesRelated
};

const RelatedPanel = memo<RelatedPanelProps>(function RelatedPanel(props) {
	const { isOpen, items, onClose, show } = props;
	const [isShowingAllAbstracts, { toggle: toggleAbstracts }] = useBool(false);

	const relationship = useMemo(() => {
		const { title, type } = show;
		switch(type){
		case ShowTypeRelated.ADDED_ON:
			return {
				string: "item",
				suffix: " added on " + title
			};
		case ShowTypeRelated.WITH_ABSTRACT:
			return {
				string: "abstract",
				suffix: " containing " + title
			};
		case ShowTypeRelated.WITH_TAG:
		default:
			return {
				string: "item",
				suffix: " tagged with " + title
			};
		}
	}, [show]);

	const panelLabel = useMemo(() => {
		return <h5 id={PANEL_LABEL_ID} className="panel-tt">{pluralize(items.length, relationship.string, relationship.suffix)}</h5>;
	}, [items.length, relationship]);

	const headerRight = useMemo(() => {
		return (
			<div className={["header-right", CustomClasses.TEXT_AUXILIARY].join(" ")}>
				<Button icon="cross" minimal={true} onClick={onClose} title="Close dialog" />
			</div>
		);
	}, [onClose]);

	return (
		<AuxiliaryDialog
			ariaLabelledBy={PANEL_LABEL_ID}
			className="related"
			isOpen={isOpen}
			onClose={onClose}
		>
			<div className={ Classes.DIALOG_BODY }>
				<ErrorBoundary>
					<div className="header-content">
						<div className="header-left">
							{panelLabel}
							<Button className={CustomClasses.TEXT_SMALL}
								minimal={true} 
								onClick={toggleAbstracts}
								zr-role="toggle-abstracts" >
								{isShowingAllAbstracts ? "Hide" : "Show"} abstracts
							</Button>
						</div>
						{headerRight}
					</div>
					<div className="rendered-div">
						<RelatedList 
							allAbstractsShown={isShowingAllAbstracts}
							closeDialog={onClose}
							items={items}
							type={show.type}
						/>
					</div>	
				</ErrorBoundary>
			</div>
		</AuxiliaryDialog>
	);
});


export default RelatedPanel;
