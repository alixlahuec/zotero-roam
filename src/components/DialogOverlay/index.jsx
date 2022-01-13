import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { Classes, Dialog } from "@blueprintjs/core";
import "./index.css";

function MainPanel(props){
	const { contents, style } = props;
	return (
		<div className="main-panel" style={style}>
			{contents}
		</div>
	);
}
MainPanel.propTypes = {
	contents: PropTypes.node,
	style: PropTypes.object
};

function SidePanel(props) {
	const { contents, style } = props;
	return (
		<div className="side-panel" style={style}>
			<div className="side-panel-contents">
				{contents}
			</div>
		</div>
	);
}
SidePanel.propTypes = {
	contents: PropTypes.node,
	style: PropTypes.object
};

function DialogOverlay(props) {
	const { 
		ariaLabelledBy, 
		className: dialogClass,
		isOpen,
		isSidePanelOpen,
		lazy = true,
		mainPanel,
		onClose,
		onOpening,
		portalTarget,
		sidePanel
	} = props;
    
	const dialog_class = useMemo(() => "zr-dialog-overlay--" + dialogClass, []);
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
	const sidePanelStyle = useMemo(() => {
		return {
			flex: "1 0 0%",
			flexBasis: isSidePanelOpen ? "20vw!important" : "0%"
		};
	}, [isSidePanelOpen]);

	return (
		createPortal(
			<Dialog
				ariaLabelledBy={ariaLabelledBy}
				className={dialog_class}
				isOpen={isOpen}
				lazy={lazy}
				usePortal={false}
				style={dialogStyle}
				canEscapeKeyClose={true}
				canOutsideClickClose={true}
				onClose={onClose}
				onOpening={onOpening}
			>
				<div className={Classes.DIALOG_BODY}>
					<MainPanel style={mainPanelStyle} contents={mainPanel} />
					<SidePanel style={sidePanelStyle} contents={sidePanel} />
				</div>
			</Dialog>,
			portalTarget)
	);
}

export default DialogOverlay;
