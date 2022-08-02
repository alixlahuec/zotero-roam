import React, { useCallback, useContext, useMemo, useState } from "react";
import { func as funcType, node } from "prop-types";

import * as customPropTypes from "../../../propTypes";
import { RowGroup, RowGroupOption, SingleInput, TextField, TextWithSelect } from "../common";


const AnnotationsSettings = React.createContext({});

const AnnotationsProvider = ({ children, init, updater }) => {
	const [annotations, _setAnnotations] = useState(init);

	const setAnnotations = useCallback((updateFn) => {
		_setAnnotations((prevState) => {
			const update = updateFn(prevState);
			updater(update);
			window?.zoteroRoam?.updateSetting?.("annotations", update);
			return update;
		});
	}, [updater]);

	const contextValue = useMemo(() => [annotations, setAnnotations], [annotations, setAnnotations]);

	return (
		<AnnotationsSettings.Provider value={contextValue}>
			{children}
		</AnnotationsSettings.Provider>
	);
};
AnnotationsProvider.propTypes = {
	children: node,
	init: customPropTypes.annotationsSettingsType,
	updater: funcType
};

const useAnnotationsSettings = () => {
	const context = useContext(AnnotationsSettings);

	return context;
};

const GROUP_BY_OPTIONS = [
	{ label: "Group by date added", value: "dateAdded" },
	{ label: "Don't group annotations", value: false }
];

const USE_OPTIONS = {
	"default": "Default formatter",
	"function": "Custom function"
};

const WITH_OPTIONS = [
	{ label: "Raw metadata", value: "raw" },
	{ label: "Formatted contents", value: "formatted" }
];

function AnnotationsWidget(){
	const [
		{
			comment_prefix,
			comment_suffix,
			func,
			group_by,
			highlight_prefix,
			highlight_suffix,
			use,
			__with
		},
		setOpts
	] = useAnnotationsSettings();

	const handlers = useMemo(() => {
		function updateSingleValue(op, val){
			setOpts(prevState => ({
				...prevState,
				[op]: val
			}));
		}

		return {
			updateCommentPrefix: (val) => updateSingleValue("comment_prefix", val),
			updateCommentSuffix: (val) => updateSingleValue("comment_suffix", val),
			updateFuncName: (val) => updateSingleValue("func", val),
			updateGroupBy: (val) => updateSingleValue("group_by", val),
			updateHighlightPrefix: (val) => updateSingleValue("highlight_prefix", val),
			updateHighlightSuffix: (val) => updateSingleValue("highlight_suffix", val),
			updateUseType: (val) => updateSingleValue("__with", val),
			updateWithFormat: (val) => updateSingleValue("use", val)
		};
	}, [setOpts]);

	const customFuncButtonProps = useMemo(() => ({
		intent: "primary",
		rightIcon: "caret-down"
	}), []);

	return <>
		<TextField description="Content to insert at the beginning of a comment block (default: '')" ifEmpty={true} label="Enter a prefix value for comment blocks" onChange={handlers.updateCommentPrefix} title="Comment Prefix" value={comment_prefix} />
		<TextField description="Content to insert at the end of a comment block (default: '')" ifEmpty={true} label="Enter a suffix value for comment blocks" onChange={handlers.updateCommentSuffix} title="Comment Suffix" value={comment_suffix} />
		<TextField description="Content to insert at the beginning of a highlight block (default: '[[>]]')" ifEmpty={true} label="Enter a prefix value for highlight blocks" onChange={handlers.updateHighlightPrefix} title="Highlight Prefix" value={highlight_prefix} />
		<TextField description="Content to insert at the end of a highlight block (default: '([p. {{page_label}}]({{link_page}})) {{tags_string}}')" ifEmpty={true} label="Enter a suffix value for highlight blocks" onChange={handlers.updateHighlightSuffix} title="Highlight Suffix" value={highlight_suffix} />
		<RowGroup title="Formatter"
			description="Choose a way to format annotations metadata when importing from Zotero."
			onChange={handlers.updateUseType} 
			options={USE_OPTIONS} 
			selected={use}>
			<RowGroupOption id="default">
				<SingleInput menuTitle="Select whether annotations should be grouped" onChange={handlers.updateGroupBy} options={GROUP_BY_OPTIONS} value={group_by} />
			</RowGroupOption>
			<RowGroupOption id="function" description="Enter the name of a custom function">
				<TextWithSelect 
					onSelectChange={handlers.updateWithFormat} 
					onValueChange={handlers.updateFuncName} 
					placeholder="Type a function's name" 
					selectButtonProps={customFuncButtonProps} 
					selectOptions={WITH_OPTIONS} 
					selectValue={__with} 
					textValue={func} 
					inputLabel="Enter the name of the function to use for formatting annotations" 
					selectLabel="Select an input format for your custom function" />
			</RowGroupOption>
		</RowGroup>
	</>;
}

export {
	AnnotationsProvider,
	AnnotationsWidget,
	useAnnotationsSettings
};