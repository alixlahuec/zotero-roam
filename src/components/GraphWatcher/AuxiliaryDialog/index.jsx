import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Classes, Dialog, } from "@blueprintjs/core";

import RelatedPanel from "./RelatedPanel";
import SemanticPanel from "./SemanticPanel";
import * as customPropTypes from "../../../propTypes";
import "./index.css";

const AuxiliaryDialog = React.memo(function AuxiliaryDialog(props) {
	const {
		ariaLabelledBy,
		className: dialogClass,
		isOpen,
		items,
		metadataSettings,
		onClose,
		portalId,
		show
	} = props;

	const dialog_class = useMemo(() => "zr-auxiliary-dialog--" + dialogClass, [dialogClass]);

	const dialogContents = useMemo(() => {
		let { title, type } = show;
		let panelProps = { 
			ariaLabelledBy, 
			items,
			metadataSettings,
			onClose,
			portalId,
			type,
			title
		};

		if(["is_citation", "is_reference"].includes(type)){
			return (
				<SemanticPanel {...panelProps} />
			);
		} else {
			let relatedProps = {
				...panelProps,
				sort: type == "added_on" ? "added" : "meta"
			};
			return (
				<RelatedPanel {...relatedProps} />
			);
		}
	}, [show, items, metadataSettings, onClose, ariaLabelledBy, portalId]);

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
			document.getElementById(portalId))
	);
});
AuxiliaryDialog.propTypes = {
	ariaLabelledBy: PropTypes.string,
	className: PropTypes.string,
	isOpen: PropTypes.bool,
	items: PropTypes.arrayOf(PropTypes.oneOf([customPropTypes.cleanRelatedItemType, customPropTypes.cleanSemanticReturnType])),
	metadataSettings: PropTypes.object,
	onClose: PropTypes.func,
	portalId: PropTypes.string,
	show: PropTypes.shape({
		title: PropTypes.string,
		type: PropTypes.oneOf(["added_on", "with_abstract", "with_tag", "is_citation", "is_reference"])
	})
};

export default AuxiliaryDialog;
