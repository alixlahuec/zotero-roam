import { memo, useCallback, useMemo } from "react";
import { arrayOf, bool, func, shape, string } from "prop-types";

import { Button, ButtonGroup, Spinner } from "@blueprintjs/core";

import CollectionsSelector from "./CollectionsSelector";
import LibrarySelector from "./LibrarySelector";
import NoWriteableLibraries from "../Errors/NoWriteableLibraries";
import SentryBoundary from "../Errors/SentryBoundary";
import TagsSelector from "../Inputs/TagsSelector";

import { useQuery_Citoid, useQuery_Collections, useWriteableLibraries } from "../../api/queries";
import { useImportCitoids } from "../../api/write";
import useMulti from "../../hooks/useMulti";
import { useRequestsSettings } from "../UserSettings/Requests";
import useSelect from "../../hooks/useSelect";

import { sortCollections } from "../../utils";

import { CustomClasses } from "../../constants";

import * as customPropTypes from "../../propTypes";

import "./index.css";


const ImportButton = memo(function ImportButton(props) {
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
				text: "Loading...",
				title: "Importing items..."
			};
		} else if(status == "error") {
			return {
				disabled: true,
				intent: "danger",
				rightIcon: "error",
				text: "Error",
				title: "Error while importing items"
			};
		} else {
			return {
				disabled: !isActive,
				intent: "primary",
				loading: !isDataReady,
				rightIcon: "chevron-right",
				text: "Send to Zotero",
				title: isDataReady ? "Import items to Zotero" : "Loading items data..."
			};
		}
	}, [isActive, isDataReady, status]);

	return (
		<Button className={[CustomClasses.TEXT_SMALL, "zr-import--trigger"].join(" ")} onClick={triggerImport} {...buttonProps} />
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

const ImportPanel = memo(function ImportPanel(props) {
	const { collections, identifiers, isActive, libraries, resetImport } = props;
	const [selectedLib, handleLibSelection] = useSelect({
		start: libraries[0],
		transform: (path) => libraries.find(lib => lib.path == path)
	});
	const [selectedColls, { set: setSelectedColls, toggle: onCollSelect }] = useMulti({
		start: []
	});
	const [selectedTags, { add: onTagSelect, remove: onTagRemove }] = useMulti({
		start: []
	});

	const onLibChange = useCallback((event) => {
		handleLibSelection(event);
		setSelectedColls();
	}, [handleLibSelection, setSelectedColls]);

	const selectedLibCollections = useMemo(() => {
		const libCollections = collections.filter(cl => {
			const { id, type } = cl.library;
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
					<Button className={[CustomClasses.TEXT_SMALL, "zr-import--cancel"].join(" ")} icon="chevron-left" intent="warning" onClick={resetImport}>Cancel</Button>
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
						onSelect={onLibChange} />
				</div>
				<CollectionsSelector 
					collections={selectedLibCollections}
					onSelect={onCollSelect}
					selectedCollections={selectedColls} />
				<TagsSelector 
					onRemove={onTagRemove}
					onSelect={onTagSelect}
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

const ZoteroImport = memo(function ZoteroImport(props) {
	const { identifiers, isActive, resetImport } = props;
	const [{ libraries }] = useRequestsSettings();

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
