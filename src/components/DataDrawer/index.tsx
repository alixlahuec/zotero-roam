import { Button, Classes, Drawer, DrawerProps, Tab, Tabs } from "@blueprintjs/core";
import { ErrorBoundary } from "Components/Errors";

import { CustomClasses } from "../../constants";
import "./_index.sass";


type ItemProps = {
	item: Record<string, any>
};

function RawItem({ item }: ItemProps){
	return <pre className={[Classes.CODE_BLOCK, CustomClasses.TEXT_AUXILIARY].join(" ")}>{JSON.stringify(item, null, "  ")}</pre>;
}


function DataDrawer({ item, isOpen, onClose }: ItemProps & Pick<DrawerProps, "isOpen" | "onClose">){
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

export default DataDrawer;