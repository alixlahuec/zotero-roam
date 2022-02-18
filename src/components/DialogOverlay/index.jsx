import React, { useContext, useMemo } from "react";
import { bool, func, node, string } from "prop-types";
import { createPortal } from "react-dom";
import { Classes, Dialog } from "@blueprintjs/core";

import { ExtensionContext } from "../App";
import "./index.css";

const DialogOverlay = React.memo(function DialogOverlay(props) {
	const { 
		ariaLabelledBy,
		children, 
		className: dialogClass,
		isOpen,
		lazy = true,
		onClose,
		onOpening,
		...otherProps
	} = props;
	const { portalId } = useContext(ExtensionContext);
    
	const dialog_class = useMemo(() => "zr-dialog-overlay--" + dialogClass, [dialogClass]);
	const mainPanelStyle = useMemo(() => {
		return {
			flex: "1 1 100%"
		};
	}, []);

	return (
		createPortal(
			<Dialog
				ariaLabelledBy={ariaLabelledBy}
				canEscapeKeyClose={true}
				canOutsideClickClose={true}
				className={dialog_class}
				enforceFocus={false}
				isOpen={isOpen}
				lazy={lazy}
				onClose={onClose}
				onOpening={onOpening}
				usePortal={false}
				{...otherProps}
			>
				<div className={Classes.DIALOG_BODY}>
					<div className="main-panel" style={mainPanelStyle}>
						{children}
					</div>
				</div>
			</Dialog>,
			document.getElementById(portalId))
	);
});
DialogOverlay.propTypes = {
	ariaLabelledBy: string,
	children: node,
	className: string,
	isOpen: bool,
	lazy: bool,
	onClose: func,
	onOpening: func
};

export default DialogOverlay;
