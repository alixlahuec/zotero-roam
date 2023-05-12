import { memo, useContext, useMemo } from "react";
import { createPortal } from "react-dom";
import { Classes, Dialog, DialogProps } from "@blueprintjs/core";

import { ExtensionContext } from "Components/App";

import { CustomClasses } from "../../constants";
import "./index.css";


type OwnProps = {
	ariaLabelledBy: DialogProps["aria-labelledby"],
	className: string,
};

const DialogOverlay = memo<OwnProps & Pick<DialogProps, "isOpen" | "lazy" | "onClose" | "onOpening">>(
	function DialogOverlay(props) {
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
    
		const dialog_class = useMemo(() => CustomClasses.PREFIX_DIALOG_OVERLAY + dialogClass, [dialogClass]);
		const mainPanelStyle = useMemo(() => {
			return {
				flex: "1 1 100%"
			};
		}, []);

		return (
			createPortal(
				<Dialog
					aria-labelledby	={ariaLabelledBy}
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
				document.getElementById(portalId)!)
		);
	}
);

export default DialogOverlay;