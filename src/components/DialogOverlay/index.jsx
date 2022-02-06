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
		isSidePanelOpen,
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
	const dialogStyle = useMemo(() => {
		return {
			width: isSidePanelOpen ? "calc(95% - 20vw)" : "calc(95% - 40vw)"
		};
	}, [isSidePanelOpen]);

	/* const sidePanelStyle = useMemo(() => {
		return {
			flex: isSidePanelOpen ? "1 0 20vw" : "0 0 0%";
		};
	}, [isSidePanelOpen]); */

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
				style={dialogStyle}
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
	isSidePanelOpen: bool,
	lazy: bool,
	onClose: func,
	onOpening: func
};

export default DialogOverlay;
