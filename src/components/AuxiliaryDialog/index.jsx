import React, { useMemo, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Button, Classes, Dialog } from "@blueprintjs/core";

import "./index.css";
import { pluralize } from "../../utils";

const RelatedItem = React.memo(function RelatedItem(props) {
	const { item } = props;
	const [isAbstractVisible, setAbstractVisible] = useState(false);

	const toggleAbstract = useCallback(() => {
		setAbstractVisible(!isAbstractVisible);
	}, [isAbstractVisible]);

	return (
		<li className="zotero-roam-list-item" data-item-type={item.data.itemType}>
			<div className={ Classes.MENU_ITEM } label={item.key}>
				<div className={[Classes.FILL, "zotero-roam-item-contents"].join(" ")}>
					<span className="zotero-roam-search-item-title" style={{ whiteSpace: "normal" }}>{item.data.title}</span>
					<span className="zr-highlight">{item.data.publicationTitle}</span>
					<span className="zotero-roam-list-item-key zr-text-small zr-auxiliary">[{item.key}]</span>
					{item.data.abstractNote
						? <Button className="zotero-roam-citation-toggle-abstract" onClick={toggleAbstract} intent="primary" minimal={true} small={true}>Show Abstract</Button>
						: null}
					{item.data.abstractNote && isAbstractVisible
						? <span className="zotero-roam-citation-abstract zr-text-small zr-auxiliary">{item.data.abstractNote}</span>
						: null}
				</div>
			</div>
		</li>
	);
});
RelatedItem.propTypes = {
	item: PropTypes.object
};

function RelatedByTags(props){
	const { items, tag } = props;

	return (
		<>
			<h5>{pluralize(items.length, "item", `tagged with ${tag}`)}</h5>
			<ul className={ Classes.LIST_UNSTYLED }>
				{items.map(it => {
					let location = it.library.type + "s/" + it.library.id;
					return (
						<RelatedItem key={[location, it.key].join("-")} item={it} />
					);
				})}
			</ul>
		</>
	);
}
RelatedByTags.propTypes ={
	items: PropTypes.array,
	tag: PropTypes.string
};

const AuxiliaryDialog = React.memo(function AuxiliaryDialog(props) {
	const {
		ariaLabelledBy,
		className: dialogClass,
		isOpen,
		items,
		onClose,
		portalTarget,
		show
	} = props;

	const dialog_class = useMemo(() => "zr-auxiliary-dialog--" + dialogClass, []);

	const dialogContents = useMemo(() => {
		if(show.type == "with_tag"){
			return (
				<RelatedByTags items={items} tag={show.tag} />
			);
		} else {
			return null;
		}
	}, [show.tag, show.type, items]);

	return (
		createPortal(
			<Dialog
				ariaLabelledBy={ariaLabelledBy}
				className={dialog_class}
				isOpen={isOpen}
				lazy={true}
				usePortal={false}
				canEscapeKeyClose={true}
				canOutsideClickClose={true}
				onClose={onClose}
			>
				<div className={Classes.DIALOG_BODY}>
					{dialogContents}
				</div>
			</Dialog>,
			portalTarget)
	);
});
AuxiliaryDialog.propTypes = {
	ariaLabelledBy: PropTypes.string,
	className: PropTypes.string,
	isOpen: PropTypes.bool,
	items: PropTypes.array,
	onClose: PropTypes.func,
	portalTarget: PropTypes.string,
	show: PropTypes.object
};

export default AuxiliaryDialog;
