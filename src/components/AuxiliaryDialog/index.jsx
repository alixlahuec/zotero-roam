import React, { useContext, useMemo } from "react";
import { createPortal } from "react-dom";
import { arrayOf, bool, func, node, string } from "prop-types";
import { Dialog, } from "@blueprintjs/core";

import { ExtensionContext } from "../App";
import "./index.css";

const AuxiliaryDialog = React.memo(function AuxiliaryDialog(props) {
	const {
		ariaLabelledBy = null,
		className: dialogClass,
		extraClasses = [],
		isOpen,
		onClose,
		title = null
	} = props;
	const { portalId } = useContext(ExtensionContext);

	const dialog_class = useMemo(() => ["zr-auxiliary-dialog--" + dialogClass, ...extraClasses].join(" "), [dialogClass, extraClasses]);

	return (
		createPortal(
			<Dialog
				ariaLabelledBy={ariaLabelledBy}
				canEscapeKeyClose={true}
				canOutsideClickClose={true}
				className={dialog_class}
				enforceFocus={false}
				isOpen={isOpen}
				lazy={true}
				title={title}
				usePortal={false}
				onClose={onClose}
			>
				{props.children}
			</Dialog>,
			document.getElementById(portalId))
	);
});
AuxiliaryDialog.propTypes = {
	ariaLabelledBy: string,
	children: node,
	className: string,
	extraClasses: arrayOf(string),
	isOpen: bool,
	onClose: func,
	title: string
};

export default AuxiliaryDialog;
