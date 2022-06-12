import React from "react";
import { Button, Classes, Drawer, Tab, Tabs } from "@blueprintjs/core";
import { bool, func, object } from "prop-types";

import SentryBoundary from "../Errors/SentryBoundary";
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
			<SentryBoundary>
				<Tabs animate={false} className="zr-tabs-minimal" id="zr-drawer--data" >
					<Tab id="item" panel={<RawItem item={item} />} title="Item" />
					<Tabs.Expander />
					<Button icon="cross" minimal={true} onClick={onClose} />
				</Tabs>
			</SentryBoundary>
		</Drawer>
	);
}
DataDrawer.propTypes = {
	item: object,
	isOpen: bool,
	onClose: func
};

export default DataDrawer;