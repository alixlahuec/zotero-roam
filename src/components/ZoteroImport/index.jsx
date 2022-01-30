import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, ButtonGroup, Callout, Checkbox, MenuItem, RadioGroup, Spinner } from "@blueprintjs/core";
import { MultiSelect } from "@blueprintjs/select";

import { useQuery_Citoid, useQuery_Collections, useQuery_Permissions } from "../../api/queries";
import { useImportCitoids } from "../../api/write";
import { getAllPages } from "../../roam";
import { sortCollections } from "../../utils";

import * as customPropTypes from "../../propTypes";
import "./index.css";

const NoWriteableLibraries = <Callout>No writeable libraries were found. Please check that your API key(s) have the permission to write to at least one of the Zotero libraries you use. <a href="https://app.gitbook.com/@alix-lahuec/s/zotero-roam/getting-started/prereqs#zotero-api-credentials" target="_blank" rel="noreferrer">Refer to the extension docs</a> for more details.</Callout>;

function itemRenderer(item, itemProps) {
	let { handleClick, modifiers: { active } } = itemProps;
	return <MenuItem active={active} onClick={handleClick} text={item} />;
}

function itemPredicate(query, item) {
	return item.toLowerCase().includes(query.toLowerCase());
}

const ImportButton = React.memo(function ImportButton(props) {
	const { identifiers, importProps, isActive } = props;

	const citoidQueries = useQuery_Citoid(identifiers, { enabled: isActive > 0 && identifiers.length > 0});
	const isDataReady = citoidQueries.every(q => q.data);
	const citoids = citoidQueries.map(q => q.data).filter(Boolean);

	const { mutate, status } = useImportCitoids();

	const triggerImport = useCallback(() => {
		const { collections, library, tags } = importProps;
		mutate({ citoids, collections, library, tags });
	}, [citoids, importProps, mutate]);

	const buttonProps = useMemo(() => {
		if(status == "loading"){
			return {
				disabled: true,
				text: "Loading..."
			};
		} else if(status == "success") {
			return {
				disabled: true,
				icon: "check",
				intent: "success",
				text: "Done"
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
		library: PropTypes.shape({
			apikey: PropTypes.string,
			path: PropTypes.string
		}),
		tags: PropTypes.arrayOf(PropTypes.string)
	}),
	isActive: PropTypes.bool
};

const ImportPanel = React.memo(function ImportPanel(props) {
	const { collections, identifiers, isActive, libraries, resetImport } = props;
	const [selectedLib, setSelectedLib] = useState(libraries[0]);
	const [selectedColls, setSelectedColls] = useState([]);
	const [selectedTags, setSelectedTags] = useState([]);

	const [roamPages,] = useState(getAllPages());

	const handleLibSelection = useCallback((event) => {
		setSelectedLib(libraries.find(lib => lib.path == event.currentTarget.value));
		setSelectedColls([]);
	}, [libraries]);

	const selectedLibCollections = useMemo(() => {
		let libCollections = collections.filter(cl => {
			let { id, type } = cl.library;
			return (type + "s/" + id) == selectedLib.path;
		});
		return sortCollections(libCollections);
	}, [collections, selectedLib]);

	const handleCollChange = useCallback((key) => {
		setSelectedColls(currentSelection => {
			if(currentSelection.includes(key)){
				return currentSelection.filter(coll => coll.key != key);
			} else {
				return [...currentSelection, key];
			}
		});
	}, []);

	const createTag = useCallback((string) => string, []);

	const addTag = useCallback((tag, _event) => {
		setSelectedTags(currentTags => {
			if(!currentTags.includes(tag)){
				return [...currentTags, tag];
			}
		});
	}, []);

	const removeTag = useCallback((tag, _index) => {
		setSelectedTags(currentTags => {
			return currentTags.filter(t => t != tag);
		});
	}, []);

	const tagRenderer = useCallback((tag) => tag, []);

	const tagInputProps = useMemo(() => {
		return {
			leftIcon: "tag",
			tagProps: {
				minimal: true
			}
		};
	}, []);

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
					<ImportButton identifiers={identifiers} importProps={importProps} isActive={isActive} />
				</ButtonGroup>
			</div>
			<div className="import-options">
				<div className="options-library-list">
					<RadioGroup 
						inline={false}
						name="import-library"
						onChange={handleLibSelection}
						options={libraries.map(lib => { return { value: lib.path }; })}
						selectedValue={selectedLib.path}/>
				</div>
				{collections.length == 0
					? <Spinner />
					: <div className="options-collections-list">
						{selectedLibCollections.map(coll => {
							return <Checkbox key={coll.key}
								checked={selectedColls.includes(coll.key)}
								data-option-depth={coll.depth}
								defaultChecked={false}
								inline={false}
								label={coll.data.name}
								onChange={() => handleCollChange(coll.key)}
							/>;})}
					</div>
				}
				<div className="options-tags">
					<MultiSelect
						createNewItemFromQuery={createTag}
						createNewItemPosition="first"
						fill={true}
						initialContent={null}
						itemPredicate={itemPredicate}
						itemRenderer={itemRenderer}
						items={roamPages}
						onItemSelect={addTag}
						onRemove={removeTag}
						openOnKeyDown={true}
						placeholder="Add tags from Roam"
						selectedItems={selectedTags}
						tagInputProps={tagInputProps}
						tagRenderer={tagRenderer}
					/>
				</div>
			</div>
		</>
	);

});
ImportPanel.propTypes = {
	collections: PropTypes.arrayOf(customPropTypes.zoteroCollectionType),
	identifiers: PropTypes.arrayOf(PropTypes.string),
	isActive: PropTypes.bool,
	libraries: PropTypes.arrayOf(PropTypes.shape({
		apikey: PropTypes.string,
		path: PropTypes.string
	})),
	resetImport: PropTypes.func
};

const ZoteroImport = React.memo(function ZoteroImport(props) {
	const { identifiers, libraries, selectProps: { resetImport } } = props;
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
	libraries: PropTypes.arrayOf(PropTypes.shape({
		apikey: PropTypes.string,
		path: PropTypes.string
	})),
	selectProps: PropTypes.shape({
		handleRemove: PropTypes.func,
		handleSelect: PropTypes.func,
		items: PropTypes.arrayOf(PropTypes.string),
		resetImport: PropTypes.func
	})
    
};

export default ZoteroImport;
