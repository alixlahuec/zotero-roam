import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Dialog, } from "@blueprintjs/core";

import "./index.css";

const AuxiliaryDialog = React.memo(function AuxiliaryDialog(props) {
	const {
		ariaLabelledBy,
		className: dialogClass,
		extraClasses = [],
		isOpen,
		onClose,
		portalId
	} = props;

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
	portalId: PropTypes.string
};

export default AuxiliaryDialog;
