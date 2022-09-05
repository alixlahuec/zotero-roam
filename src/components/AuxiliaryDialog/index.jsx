import { arrayOf, bool, func, node, string } from "prop-types";
import { memo, useContext, useMemo } from "react";
import { createPortal } from "react-dom";

import { Dialog, H5 } from "@blueprintjs/core";
import { ExtensionContext } from "../App";

import { CustomClasses } from "../../constants";

import "./index.css";


const AuxiliaryDialog = memo(function AuxiliaryDialog(props) {
	const {
		ariaLabelledBy = null,
		className: dialogClass,
		extraClasses = [],
		isOpen,
		label = null,
		onClose,
		title = null
	} = props;
	const { portalId } = useContext(ExtensionContext);

	const dialog_class = useMemo(() => [CustomClasses.PREFIX_DIALOG_AUXILIARY + dialogClass, ...extraClasses].join(" "), [dialogClass, extraClasses]);

	const dialog_label = useMemo(() => {
		if(!ariaLabelledBy && label){
			return {
				element: <H5 id={dialogClass + "-label"} style={{ display: "none" }}>{label}</H5>,
				id: dialogClass + "-label"
			};
		} else {
			return {
				element: null,
				id: null
			};
		}
	}, [ariaLabelledBy, dialogClass, label]);

	return (
		createPortal(
			<Dialog
				aria-labelledby	={ariaLabelledBy || dialog_label.id}
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
				{dialog_label.element}
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
	label: string,
	onClose: func,
	title: string
};

export default AuxiliaryDialog;
