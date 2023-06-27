import { FC, useMemo } from "react";
import { createPortal } from "react-dom";
import { Classes, Dialog, DialogProps } from "@blueprintjs/core";

import { useExtensionContext } from "Components/App";

import { CustomClasses } from "../../constants";
import "./_index.sass";


type OwnProps = {
	ariaLabelledBy: DialogProps["aria-labelledby"],
	className: string,
	onClose: () => void
};

export type DialogOverlayProps = OwnProps & Pick<DialogProps, "isOpen" | "lazy" | "onOpening">;

const DialogOverlay: FC<DialogOverlayProps> = (props) => {
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
	const { portalId } = useExtensionContext();
    
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
};

export default DialogOverlay;
