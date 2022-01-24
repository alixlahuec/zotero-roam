import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { Classes, Dialog } from "@blueprintjs/core";
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
		portalTarget,
		...otherProps
	} = props;
    
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
			flex: "1 0 0%",
			flexBasis: isSidePanelOpen ? "20vw!important" : "0%"
		};
	}, [isSidePanelOpen]); */

	return (
		createPortal(
			<Dialog
				ariaLabelledBy={ariaLabelledBy}
				canEscapeKeyClose={true}
				canOutsideClickClose={true}
				className={dialog_class}
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
			document.getElementById(portalTarget))
	);
});
DialogOverlay.propTypes = {
	ariaLabelledBy: PropTypes.string,
	children: PropTypes.node,
	className: PropTypes.string,
	isOpen: PropTypes.bool,
	isSidePanelOpen: PropTypes.bool,
	lazy: PropTypes.bool,
	onClose: PropTypes.func,
	onOpening: PropTypes.func,
	portalTarget: PropTypes.string
};

export default DialogOverlay;
