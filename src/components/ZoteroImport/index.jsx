import React, { useCallback, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, ButtonGroup, Callout, Spinner } from "@blueprintjs/core";

import CollectionsSelector from "./CollectionsSelector";
import LibrarySelector from "./LibrarySelector";
import TagsSelector from "./TagsSelector";

import { useQuery_Citoid, useQuery_Collections, useQuery_Permissions } from "../../api/queries";
import { useImportCitoids } from "../../api/write";
import { sortCollections } from "../../utils";

import { ExtensionContext } from "../App";
import * as customPropTypes from "../../propTypes";
import "./index.css";

const NoWriteableLibraries = <Callout>No writeable libraries were found. Please check that your API key(s) have the permission to write to at least one of the Zotero libraries you use. <a href="https://app.gitbook.com/@alix-lahuec/s/zotero-roam/getting-started/prereqs#zotero-api-credentials" target="_blank" rel="noreferrer">Refer to the extension docs</a> for more details.</Callout>;

const ImportButton = React.memo(function ImportButton(props) {
	const { identifiers, importProps, isActive, resetImport } = props;

	const citoidQueries = useQuery_Citoid(identifiers, { 
		enabled: isActive && identifiers.length > 0,
		select: (data) => data.item
	});
	const isDataReady = citoidQueries.every(q => q.data);
	const citoids = citoidQueries.map(q => q.data).filter(Boolean);

	const { mutate, status } = useImportCitoids();

	const triggerImport = useCallback(() => {
		const { collections, library, tags } = importProps;
		mutate({ 
			collections, 
			items: citoids, 
			library, 
			tags 
		}, {
			onSettled: (_data, _error, _variables) => resetImport()
		});
	}, [citoids, importProps, mutate, resetImport]);

	const buttonProps = useMemo(() => {
		if(status == "loading"){
			return {
				disabled: true,
				text: "Loading..."
			};
		} else if(status == "error") {
			return {
				disabled: true,
				icon: "error",
				intent: "danger",
				text: "Error"
			};
		} else {
			return {
				disabled: !isActive,
				icon: "inheritance",
				intent: "primary",
				loading: !isDataReady,
				text: "Add to Zotero"
			};
		}
	}, [isActive, isDataReady, status]);

	return (
		<Button alignText="right" onClick={triggerImport} {...buttonProps} />
	);
});
ImportButton.propTypes = {
	identifiers: PropTypes.arrayOf(PropTypes.string),
	importProps: PropTypes.shape({
		collections: PropTypes.arrayOf(PropTypes.string),
		library: customPropTypes.zoteroLibraryType,
		tags: PropTypes.arrayOf(PropTypes.string)
	}),
	isActive: PropTypes.bool,
	resetImport: PropTypes.func
};

const ImportPanel = React.memo(function ImportPanel(props) {
	const { collections, identifiers, isActive, libraries, resetImport } = props;
	const [selectedLib, setSelectedLib] = useState(libraries[0]);
	const [selectedColls, setSelectedColls] = useState([]);
	const [selectedTags, setSelectedTags] = useState([]);

	const handleCollSelection = useCallback((key) => {
		setSelectedColls(currentSelection => {
			if(currentSelection.includes(key)){
				return currentSelection.filter(coll => coll.key != key);
			} else {
				return [...currentSelection, key];
			}
		});
	}, []);

	const handleLibSelection = useCallback((lib) => {
		setSelectedLib(lib);
		setSelectedColls([]);
	}, []);

	const handleTagRemoval = useCallback((tag) => {
		setSelectedTags(currentTags => {
			return currentTags.filter(t => t != tag);
		});
	}, []);

	const handleTagSelection = useCallback((tag) => {
		setSelectedTags(currentTags => {
			if(!currentTags.includes(tag)){
				return [...currentTags, tag];
			} else {
				return currentTags;
			}
		});
	}, []);

	const selectedLibCollections = useMemo(() => {
		let libCollections = collections.filter(cl => {
			let { id, type } = cl.library;
			return (type + "s/" + id) == selectedLib.path;
		});
		return sortCollections(libCollections);
	}, [collections, selectedLib]);

	const importProps = useMemo(() => {
		return {
			collections: selectedColls,
			library: selectedLib,
			tags: selectedTags
		};
	}, [selectedColls, selectedLib, selectedTags]);

	return (
		<>
			<div className="import-header">
				<ButtonGroup fill={true} minimal={true}>
					<Button alignText="left" icon="chevron-left" intent="warning" onClick={resetImport}>Cancel</Button>
					<ImportButton 
						identifiers={identifiers} 
						importProps={importProps} 
						isActive={isActive} 
						resetImport={resetImport} />
				</ButtonGroup>
			</div>
			<div className="import-options">
				<div className="options-library-list">
					<LibrarySelector 
						libraries={libraries} 
						onSelect={handleLibSelection} 
						selectedLib={selectedLib} />
				</div>
				<CollectionsSelector 
					collections={selectedLibCollections}
					onSelect={handleCollSelection}
					selectedCollections={selectedColls} />
				<div className="options-tags">
					<TagsSelector 
						onRemove={handleTagRemoval}
						onSelect={handleTagSelection}
						selectedTags={selectedTags} />
				</div>
			</div>
		</>
	);

});
ImportPanel.propTypes = {
	collections: PropTypes.arrayOf(customPropTypes.zoteroCollectionType),
	identifiers: PropTypes.arrayOf(PropTypes.string),
	isActive: PropTypes.bool,
	libraries: PropTypes.arrayOf(customPropTypes.zoteroLibraryType),
	resetImport: PropTypes.func
};

const ZoteroImport = React.memo(function ZoteroImport(props) {
	const { identifiers, selectProps: { resetImport } } = props;
	const { libraries } = useContext(ExtensionContext);
	const selectionNotEmpty = identifiers.length > 0;

	const apiKeys = Array.from(new Set(libraries.map(lib => lib.apikey)));
	const permissionQueries = useQuery_Permissions(apiKeys, {
		notifyOnChangeProps: ["data"]
	});
	const isLoading = permissionQueries.some(q => q.isLoading);
	const permissions = permissionQueries.map(q => q.data || []).flat(1);

	const writeableLibraries = useMemo(() => {
		return libraries.filter(lib => {
			let keyData = permissions.find(k => k.key == lib.apikey);
			if(!keyData){
				return false;
			} else {
				let { access } = keyData;
				let [libType, libId] = lib.path.split("/");
				let permissions = libType == "users" ? (access.user || {}) : (access.groups[libId] || access.groups.all);
				return permissions?.write || false;
			}
		});
	}, [libraries, permissions]);

	const collectionQueries = useQuery_Collections(libraries, {
		enabled: writeableLibraries.length > 0,
		notifyOnChangeProps: ["data"],
		select: (datastore) => datastore.data
	});

	const collections = collectionQueries.map(q => q?.data || []).flat(1);

	return (
		isLoading
			? <Spinner />
			: writeableLibraries.length == 0
				? <NoWriteableLibraries /> 
				: <ImportPanel 
					collections={collections}
					identifiers={identifiers}
					isActive={selectionNotEmpty}
					libraries={writeableLibraries} 
					resetImport={resetImport} />
	);
});
ZoteroImport.propTypes = {
	identifiers: PropTypes.arrayOf(PropTypes.string),
	selectProps: PropTypes.shape({
		handleRemove: PropTypes.func,
		handleSelect: PropTypes.func,
		items: PropTypes.arrayOf(PropTypes.string),
		resetImport: PropTypes.func
	})
};

export default ZoteroImport;
