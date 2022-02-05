import React, { useContext, useMemo } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Dialog, } from "@blueprintjs/core";

import { ExtensionContext } from "../../App";
import "./index.css";

const AuxiliaryDialog = React.memo(function AuxiliaryDialog(props) {
	const {
		ariaLabelledBy,
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
	ariaLabelledBy: PropTypes.string,
	children: PropTypes.node,
	className: PropTypes.string,
	extraClasses: PropTypes.arrayOf(PropTypes.string),
	isOpen: PropTypes.bool,
	onClose: PropTypes.func,
	title: PropTypes.string
};

export default AuxiliaryDialog;
