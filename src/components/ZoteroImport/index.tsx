import { memo, useCallback, useMemo } from "react";

import { Button, ButtonGroup, Intent, Spinner } from "@blueprintjs/core";

import { ErrorBoundary, NoWriteableLibraries } from "Components/Errors";
import { TagsSelector } from "Components/Inputs";
import { useRequestsSettings } from "Components/UserSettings";
import CollectionsSelector from "./CollectionsSelector";
import LibrarySelector from "./LibrarySelector";

import { useCitoids } from "@clients/citoid";
import { ZoteroAPI, useCollections, useWriteableLibraries, useImportCitoids } from "@clients/zotero";
import { useMulti, useSelect } from "@hooks";

import { sortCollections } from "./helpers";

import { CustomClasses } from "../../constants";

import { AsBoolean } from "Types/helpers";
import { ZLibrary } from "Types/transforms";

import "./_index.sass";


type ImportButtonOwnProps = {
	importProps: {
		collections: string[],
		library: ZLibrary,
		tags: string[]
	}
};

const ImportButton = memo<ImportButtonOwnProps & ZoteroImportProps>(function ImportButton(props) {
	const { identifiers, importProps, isActive, resetImport } = props;

	const citoidQueries = useCitoids(identifiers, { 
		enabled: isActive && identifiers.length > 0,
		select: (data) => data.item
	});
	const isDataReady = citoidQueries.every(q => q.data);
	const citoids = citoidQueries.map(q => q.data).filter(AsBoolean);

	const { mutate, status } = useImportCitoids();

	const triggerImport = useCallback(() => {
		const { collections, library, tags } = importProps;
		mutate({ 
			collections, 
			items: citoids, 
			library, 
			tags 
		}, {
			onSuccess: () => resetImport()
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
				intent: Intent.DANGER,
				rightIcon: "error" as const,
				text: "Error",
				title: "Error while importing items"
			};
		} else {
			return {
				disabled: !isActive,
				intent: Intent.PRIMARY,
				loading: !isDataReady,
				rightIcon: "chevron-right" as const,
				text: "Send to Zotero",
				title: isDataReady ? "Import items to Zotero" : "Loading items data..."
			};
		}
	}, [isActive, isDataReady, status]);

	return (
		<Button className={[CustomClasses.TEXT_SMALL, "zr-import--trigger"].join(" ")} minimal={true} onClick={triggerImport} {...buttonProps} />
	);
});


type ImportPanelOwnProps = {
	collections: ZoteroAPI.Collection[],
	libraries: ZLibrary[]
};

const ImportPanel = memo<ImportPanelOwnProps & ZoteroImportProps>(function ImportPanel(props) {
	const { collections, identifiers, isActive, libraries, resetImport } = props;
	const [selectedLib, handleLibSelection] = useSelect<ZLibrary>({
		start: libraries[0],
		transform: (path) => libraries.find(lib => lib.path == path)!
	});
	const [selectedColls, { set: setSelectedColls, toggle: onCollSelect }] = useMulti<string>({
		start: []
	});
	const [selectedTags, { add: onTagSelect, remove: onTagRemove }] = useMulti<string>({
		start: []
	});

	const onLibChange = useCallback((event) => {
		handleLibSelection(event);
		setSelectedColls([]);
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
		<ErrorBoundary>
			<div className="import-header">
				<ButtonGroup fill={true} minimal={true}>
					<Button className={[CustomClasses.TEXT_SMALL, "zr-import--cancel"].join(" ")} icon="chevron-left" intent="warning" minimal={true} onClick={resetImport}>Cancel</Button>
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
		</ErrorBoundary>
	);

});


type ZoteroImportProps = {
	identifiers: string[],
	isActive: boolean,
	resetImport: () => void
};

const ZoteroImport = memo<ZoteroImportProps>(function ZoteroImport(props) {
	const { identifiers, isActive, resetImport } = props;
	const [{ libraries }] = useRequestsSettings();

	const { data: writeableLibraries, isLoading } = useWriteableLibraries(libraries);

	const collectionQueries = useCollections(libraries, {
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
					isActive={isActive}
					libraries={writeableLibraries} 
					resetImport={resetImport} />
	);
});


export default ZoteroImport;
