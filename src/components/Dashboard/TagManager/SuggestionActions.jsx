import React, { useCallback, useMemo } from "react";
import { arrayOf, bool, oneOf, oneOfType, shape, string } from "prop-types";
import { Button, ButtonGroup, Menu, MenuDivider, MenuItem, Tag } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import { useDeleteTags, useModifyTags } from "../../../api/write";

import * as customPropTypes from "../../../propTypes";

const makeSuggestionFor = (entry) => {
	let roamTags = entry.roam.map((el) => el.title);
	let zoteroTags = entry.zotero.reduce((arr, el) => {
		if (roamTags.includes(el.tag) || arr.includes(el.tag)) {
		// Do nothing
		} else {
			arr.push(el.tag);
		}
		return arr;
	}, []);

	let use = {
		roam: roamTags,
		zotero: zoteroTags
	};

	if (roamTags.length === 0) {
		if (entry.zotero.length === 1) {
			return {
				recommend: zoteroTags[0],
				type: null,
				use
			};
		} else if (zoteroTags.length === 1) {
			return {
				recommend: zoteroTags[0],
				type: "auto",
				use
			};
		} else {
			return {
				recommend: null,
				type: "manual",
				use
			};
		}
	} else if (roamTags.length === 1) {
		if (zoteroTags.length === 0) {
			return {
				recommend: roamTags[0],
				type: null,
				use
			};
		} else {
			return {
				recommend: roamTags[0],
				type: "auto",
				use
			};
		}
	} else {
		return {
			recommend: null,
			type: "manual",
			use
		};
	}
};

function MergeAsOptions({ library, options }) {
	const { roam = [], zotero = [] } = options;
	const { mutate, status } = useModifyTags();

	const triggerMerge = useCallback((value) => {
		mutate({
			into: value,
			library,
			tags: [...roam, ...zotero]
		}, {
			onSettled: (data, error, variables) => console.log(data, error, variables)
		});
	}, [library, mutate, roam, zotero]);

	return (
		<>
			{roam.map(el => (
				<MenuItem key={el} 
					disabled={["error", "success", "loading"].includes(status)}
					labelElement={<Tag intent="success" minimal={true}>In Roam</Tag>}
					multiline={true}
					onClick={() => triggerMerge(el)}
					text={el} 
				/>))}
			{zotero.map(el => <MenuItem key={el} multiline={true} text={el} />)}
			<MenuDivider />
			<MenuItem
				disabled={["error", "success", "loading"].includes(status)}
				intent="primary"
				multiline={true}
				text="Choose custom value..."
			/>
		</>
	);
}
MergeAsOptions.propTypes = {
	library: customPropTypes.zoteroLibraryType,
	options: shape({
		roam: arrayOf(string),
		zotero: arrayOf(string)
	})
};

function OptionsMenu({ deleteTags = true, library, mergeAs = true, suggestion }) {
	const { mutate, status } = useDeleteTags();

	const triggerDelete = useCallback(() => {
		mutate({
			library,
			tags: [...suggestion.use.roam, ...suggestion.use.zotero]
		});
	}, [suggestion.use, library, mutate]);

	return (
		<Menu>
			{mergeAs && suggestion.type 
				? <MenuItem disabled={status == "loading"} icon="group-objects" text="Merge as...">
					<MergeAsOptions library={library} options={suggestion.use} />
				</MenuItem>
				: null}
			{deleteTags
				? <MenuItem disabled={status == "loading"} icon="trash" intent="danger" text="Delete tag(s)" onClick={triggerDelete} />
				: null}
		</Menu>
	);
}
OptionsMenu.propTypes = {
	deleteTags: bool,
	library: customPropTypes.zoteroLibraryType,
	mergeAs: bool,
	suggestion: shape({
		recommend: oneOfType([string, oneOf([null])]),
		type: oneOf(["auto", "manual", null]),
		use: shape({
			roam: arrayOf(string),
			zotero: arrayOf(string)
		})
	})
};

function AutoMerge({ library, suggestion }){
	const { recommend, use } = suggestion;
	const { mutate, status } = useModifyTags();

	const triggerMerge = useCallback(() => {
		mutate({
			into: recommend,
			library,
			tags: [...use.roam, ...use.zotero]
		}, {
			onSettled: (data, error, variables) => console.log(data, error, variables)
		});
	}, [library, mutate, recommend, use]);

	const buttonProps = useMemo(() => {
		if(status == "error"){
			return {
				disabled: true,
				icon: "warning",
				intent: "danger"
			};
		} else if(status == "success"){
			return {
				disabled: true,
				icon: "tick",
				intent: "success"
			};
		} else {
			return {};
		}
	}, [status]);

	return <Button
		className="zr-tag-suggestion--auto-merge"
		loading={status == "loading"}
		onClick={triggerMerge}
		text="Auto-merge"
		title={"Suggestion : " + recommend}
		{...buttonProps}
	/>;
}
AutoMerge.propTypes = {
	library: customPropTypes.zoteroLibraryType,
	suggestion: shape({
		recommend: oneOfType([string, oneOf([null])]),
		type: oneOf(["auto", "manual", null]),
		use: shape({
			roam: arrayOf(string),
			zotero: arrayOf(string)
		})
	})
};

function ManualMerge({ library, suggestion }){
	return <Popover2
		content={<Menu><MergeAsOptions library={library} options={suggestion.use} /></Menu>}
		interactionKind="click"
	>
		<Button icon="caret-down" text="Merge as" />
	</Popover2>;
}
ManualMerge.propTypes = {
	library: customPropTypes.zoteroLibraryType,
	suggestion: shape({
		recommend: oneOfType([string, oneOf([null])]),
		type: oneOf(["auto", "manual", null]),
		use: shape({
			roam: arrayOf(string),
			zotero: arrayOf(string)
		})
	})
};

function SuggestionActions({ entry, library }){
	const suggestion = makeSuggestionFor(entry);
	switch(suggestion.type){
	case "auto":
	case "manual":
		return <ButtonGroup minimal={true}>
			{suggestion.type == "auto" && <AutoMerge library={library} suggestion={suggestion} />}
			{suggestion.type == "manual" && <ManualMerge library={library} suggestion={suggestion} />}
			<Popover2
				content={<OptionsMenu library={library} mergeAs={suggestion.type == "auto"} suggestion={suggestion} />}
				interactionKind="click"
				position="bottom-right"
			>
				<Button icon="more" />
			</Popover2>
		</ButtonGroup>;
	case null:
	default:
		return null;
	}
}
SuggestionActions.propTypes = {
	entry: customPropTypes.taglistEntry,
	library: customPropTypes.zoteroLibraryType
};

export default SuggestionActions;
