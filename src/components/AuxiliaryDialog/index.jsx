import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Classes, Dialog, } from "@blueprintjs/core";

import RelatedPanel from "./RelatedPanel";
import SemanticPanel from "./SemanticPanel";
import { makeTimestamp } from "../../utils";
import "./index.css";

/** Formats a list of items for display in AuxiliaryDialog
 * @param {Object[]} items - The list of items to format 
 * @returns {{
 * abstract: String,
 * added: Date,
 * inGraph: Boolean,
 * itemType: String,
 * key: String,
 * location: String,
 * meta: String,
 * timestamp: String,
 * title: String
 * }[]} The formatted array
 */
function simplifyRelatedItems(items){
	return items.map(item => {
		let creator = item.meta.creatorSummary || "";
		let pub_year = item.meta.parsedDate ? `(${new Date(item.meta.parsedDate).getUTCFullYear()})` : "";
		return {
			abstract: item.data.abstractNote || "",
			key: item.key,
			location: item.library.type + "s/" + item.library.id,
			meta: [creator, pub_year].filter(Boolean).join(" "),
			title: item.data.title || "",
			added: item.data.dateAdded,
			itemType: item.data.itemType,
			timestamp: makeTimestamp(item.data.dateAdded),
			inGraph: false
		};
	});
}

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
		let { title, type } = show;
		let panelProps = { 
			ariaLabelledBy, 
			onClose,
			type,
			title
		};

		if(["is_citation", "is_reference"].includes(type)){
			let semanticProps = {
				panelProps,
				items
			};
			return (
				<SemanticPanel {...semanticProps} />
			);
		} else {
			let relatedProps = {
				panelProps,
				items: simplifyRelatedItems(items),
				sort: type == "added_on" ? "added" : "meta"
			};
			return (
				<RelatedPanel {...relatedProps} />
			);
		}
	}, [show.type, show.title, items, onClose]);

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
			document.getElementById(portalTarget))
	);
});
AuxiliaryDialog.propTypes = {
	ariaLabelledBy: PropTypes.string,
	className: PropTypes.string,
	isOpen: PropTypes.bool,
	items: PropTypes.array,
	onClose: PropTypes.func,
	portalTarget: PropTypes.string,
	show: PropTypes.shape({
		title: PropTypes.string,
		type: PropTypes.oneOf(["added_on", "has_abstract", "has_tag", "is_citation", "is_reference"])
	})
};

export default AuxiliaryDialog;
