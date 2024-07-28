import { useMemo } from "react";
import { IconName, Tag } from "@blueprintjs/core";

import { CustomClasses } from "../../../../constants";
import { DataRequest } from "Types/extension";

import "./_index.sass";


const obfuscate = (val: string) => "*".repeat(val.length);


type OwnProps = {
	request: DataRequest
};

function DataRequestItem({ request }: OwnProps){
	const { apikey, dataURI, library: { path, type } } = request;

	const libContents = useMemo(() => {
		const tagProps = (type == "users")
			? { icon: "user" as IconName, htmlTitle: "User library" }
			: (type == "groups")
				? { icon: "people" as IconName, htmlTitle: "Group library" }
				: {};
		return <Tag minimal={true} {...tagProps}>{path}</Tag>;
	}, [path, type]);

	return <div className="zr-settings--card">
		<div zr-role="settings-row">
			<span className={CustomClasses.TEXT_AUXILIARY}>Library</span>
			<div>
				{libContents}
			</div>
		</div>
		<div zr-role="settings-row">
			<span className={CustomClasses.TEXT_AUXILIARY}>Data URI</span>
			<div>
				{dataURI && <span>{dataURI}</span>}
			</div>
		</div>
		<div zr-role="settings-row">
			<span className={CustomClasses.TEXT_AUXILIARY}>API Key</span>
			<div>
				{apikey && <span>{obfuscate(apikey)}</span>}
			</div>
		</div>
	</div>;
}


export default DataRequestItem;