import { FC, useMemo } from "react";
import { createPortal } from "react-dom";

import { Dialog, DialogProps, H5 } from "@blueprintjs/core";
import { useExtensionContext } from "Components/App";

import { CustomClasses } from "../../constants";

import "./_index.sass";


type OwnProps = {
	ariaLabelledBy?: string,
	className: string,
	extraClasses?: string[],
	label?: string
};

const AuxiliaryDialog: FC<OwnProps & Pick<DialogProps, "isOpen" | "onClose" | "title">> = (props) => {
	const {
		ariaLabelledBy = null,
		className: dialogClass,
		extraClasses = [],
		isOpen,
		label = null,
		onClose,
		title = null
	} = props;
	const { portalId } = useExtensionContext();

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
				aria-labelledby	={ariaLabelledBy || dialog_label.id || undefined}
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
			document.getElementById(portalId)!)
	);
};

export default AuxiliaryDialog;
