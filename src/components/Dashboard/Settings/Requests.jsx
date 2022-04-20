import React, { useContext, useMemo } from "react";
import { Callout, H3, Tag } from "@blueprintjs/core";
import { object } from "prop-types";
import { ExtensionContext } from "../../App";

const obfuscate = (val) => "*".repeat(val.length);

function DataRequest({ request }){
	const { apikey = null, dataURI = null, library = null, params = "" } = request;

	const libContents = useMemo(() => {
		if(!library){
			return <Callout intent="warning">{"Library could not be identified. Check that it starts with 'users/' or 'groups/'"}</Callout>;
		} else {
			const tagProps = library.startsWith("users/")
				? { icon: "user", htmlTitle: "User library" }
				: library.startsWith("groups/")
					? { icon: "people", htmlTitle: "Group library" }
					: {};
			return <Tag minimal={true} {...tagProps}>{library}</Tag>;
		}
	}, [library]);

	return <div className="zr-settings--card">
		<div zr-role="settings-row">
			<span className="zr-auxiliary">Library</span>
			<div>
				{libContents}
			</div>
		</div>
		<div zr-role="settings-row">
			<span className="zr-auxiliary">Data URI</span>
			<div>
				{dataURI != null
					? <span>{dataURI}</span>
					: <Callout intent="warning">Data URI not specified</Callout>}
			</div>
		</div>
		<div zr-role="settings-row">
			<span className="zr-auxiliary">API Key</span>
			<div>
				{apikey != null
					? <span>{obfuscate(apikey)}</span>
					: <Callout intent="warning">API key not found</Callout>}
			</div>
		</div>
		<div zr-role="settings-row">
			<span className="zr-auxiliary">Parameters</span>
			<div>
				<span>{params || "None"}</span>
			</div>
		</div>
	</div>;
}
DataRequest.propTypes = {
	request: object
};

function Requests(){
	const { dataRequests } = useContext(ExtensionContext);

	return <>
		<H3>Data Requests</H3>
		<div zr-role="settings-requests">
			{dataRequests.map((req, i) => <DataRequest key={i} request={req} />)}
		</div>
	</>;
}

export default Requests;