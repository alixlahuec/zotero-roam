import { bool, func, object } from "prop-types";

import { Button, Classes, Drawer, Tab, Tabs } from "@blueprintjs/core";
import { ErrorBoundary } from "Components/Errors";

import { CustomClasses } from "../../constants";

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
			className={CustomClasses.PREFIX_DRAWER + "data"}
			isOpen={isOpen}
			lazy={false}
			onClose={onClose}
			size="40%" >
			<ErrorBoundary>
				<Tabs animate={false} className={CustomClasses.TABS_MINIMAL} id="zr-drawer--data" >
					<Tab id="item" panel={<RawItem item={item} />} title="Item" />
					<Tabs.Expander />
					<Button icon="cross" minimal={true} onClick={onClose} />
				</Tabs>
			</ErrorBoundary>
		</Drawer>
	);
}
DataDrawer.propTypes = {
	item: object,
	isOpen: bool,
	onClose: func
};

export default DataDrawer;