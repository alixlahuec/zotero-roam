import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, ButtonGroup, Callout, Checkbox, RadioGroup, Spinner } from "@blueprintjs/core";

import { useQuery_Collections, useQuery_Permissions } from "../../queries";
import { getAllPages } from "../../roam";
import { sortCollections } from "../../utils";

import * as customPropTypes from "../../propTypes";
import "./index.css";
import { MultiSelect } from "@blueprintjs/select";

const NoWriteableLibraries = <Callout>No writeable libraries were found. Please check that your API key(s) have the permission to write to at least one of the Zotero libraries you use. <a href="https://app.gitbook.com/@alix-lahuec/s/zotero-roam/getting-started/prereqs#zotero-api-credentials" target="_blank" rel="noreferrer">Refer to the extension docs</a> for more details.</Callout>;

const ImportPanel = React.memo(function ImportPanel(props) {
	const { collections, isActive, libraries, resetImport } = props;
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

	return (
		<>
			<div className="import-header">
				<ButtonGroup fill={true} minimal={true}>
					<Button alignText="left" icon="chevron-left" intent="warning" onClick={resetImport}>Cancel</Button>
					<Button alignText="right" disabled={!isActive} icon="inheritance" intent="primary">Add to Zotero</Button>
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
	isActive: PropTypes.bool,
	libraries: PropTypes.arrayOf(PropTypes.shape({
		apikey: PropTypes.string,
		path: PropTypes.string
	})),
	resetImport: PropTypes.func
};

const ZoteroImport = React.memo(function ZoteroImport(props) {
	const { libraries, selectProps: { items, resetImport } } = props;
	const selectionNotEmpty = items.length > 0;

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
				: <ImportPanel isActive={selectionNotEmpty} collections={collections} libraries={writeableLibraries} resetImport={resetImport} />
	);
});
ZoteroImport.propTypes = {
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
