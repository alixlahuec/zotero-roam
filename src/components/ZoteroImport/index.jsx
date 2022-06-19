import React, { useCallback, useContext, useMemo, useState } from "react";
import { arrayOf, bool, func, shape, string} from "prop-types";
import { Button, ButtonGroup, Spinner } from "@blueprintjs/core";

import CollectionsSelector from "./CollectionsSelector";
import LibrarySelector from "./LibrarySelector";
import NoWriteableLibraries from "../Errors/NoWriteableLibraries";
import TagsSelector from "../Inputs/TagsSelector";

import { useQuery_Citoid, useQuery_Collections, useWriteableLibraries } from "../../api/queries";
import { useImportCitoids } from "../../api/write";
import { sortCollections } from "../../utils";

import { ExtensionContext } from "../App";
import SentryBoundary from "../Errors/SentryBoundary";
import * as customPropTypes from "../../propTypes";
import "./index.css";

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
		<Button className={["zr-text-small", "zr-import--trigger"].join(" ")} onClick={triggerImport} {...buttonProps} />
	);
});
ImportButton.propTypes = {
	identifiers: arrayOf(string),
	importProps: shape({
		collections: arrayOf(string),
		library: customPropTypes.zoteroLibraryType,
		tags: arrayOf(string)
	}),
	isActive: bool,
	resetImport: func
};

const ImportPanel = React.memo(function ImportPanel(props) {
	const { collections, identifiers, isActive, libraries, resetImport } = props;
	const [selectedLib, setSelectedLib] = useState(libraries[0]);
	const [selectedColls, setSelectedColls] = useState([]);
	const [selectedTags, setSelectedTags] = useState([]);

	const handleCollSelection = useCallback((key) => {
		setSelectedColls(currentSelection => {
			if(currentSelection.includes(key)){
				return currentSelection.filter(coll => coll != key);
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
		<SentryBoundary feature="zotero-import" extra={props}>
			<div className="import-header">
				<ButtonGroup fill={true} minimal={true}>
					<Button className={["zr-text-small", "zr-import--cancel"].join(" ")} icon="chevron-left" intent="warning" onClick={resetImport}>Cancel</Button>
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
						selectedLib={selectedLib}
						onSelect={handleLibSelection} />
				</div>
				<CollectionsSelector 
					collections={selectedLibCollections}
					onSelect={handleCollSelection}
					selectedCollections={selectedColls} />
				<TagsSelector 
					onRemove={handleTagRemoval}
					onSelect={handleTagSelection}
					selectedTags={selectedTags} />
			</div>
		</SentryBoundary>
	);

});
ImportPanel.propTypes = {
	collections: arrayOf(customPropTypes.zoteroCollectionType),
	identifiers: arrayOf(string),
	isActive: bool,
	libraries: arrayOf(customPropTypes.zoteroLibraryType),
	resetImport: func
};

const ZoteroImport = React.memo(function ZoteroImport(props) {
	const { identifiers, isActive, resetImport } = props;
	const { libraries } = useContext(ExtensionContext);

	const { data: writeableLibraries, isLoading } = useWriteableLibraries(libraries);

	const collectionQueries = useQuery_Collections(libraries, {
		enabled: writeableLibraries.length > 0,
		notifyOnChangeProps: ["data"],
		select: (datastore) => datastore.data
	});

	const collections = collectionQueries.map(q => q?.data || []).flat(1);

	return (
		isLoading
			? <Spinner title="Checking for writeable libraries" />
			: writeableLibraries.length == 0
				? <NoWriteableLibraries /> 
				: <ImportPanel 
					collections={collections}
					identifiers={identifiers}
					isActive={isActive}
					libraries={writeableLibraries} 
					resetImport={resetImport} />
	);
});
ZoteroImport.propTypes = {
	identifiers: arrayOf(string),
	isActive: bool,
	resetImport: func
};

export default ZoteroImport;
