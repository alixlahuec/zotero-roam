import React from "react";
import { Classes, Drawer } from "@blueprintjs/core";
import { bool, func, object } from "prop-types";

import "./index.css";

function RawItem({ item }){
	return <pre className={Classes.CODE_BLOCK}>{JSON.stringify(item, null, "  ")}</pre>;
}
RawItem.propTypes = {
	item: object
};

function DataDrawer({ item, isOpen, onClose }){
	return (
		<Drawer
			canEscapeKeyClose={false}
			canOutsideClickClose={true}
			className="zr-drawer--data"
			isOpen={isOpen}
			lazy={false}
			onClose={onClose}
			size="40%" >
			<RawItem item={item} />
		</Drawer>
	);
}
DataDrawer.propTypes = {
	item: object,
	isOpen: bool,
	onClose: func
};

export default DataDrawer;