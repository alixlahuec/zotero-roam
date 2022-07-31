import React, { useCallback, useContext, useMemo, useState } from "react";
import { func as funcType, node } from "prop-types";

import * as customPropTypes from "../../../propTypes";
import { SingleInput, TextField } from "../common";


const AnnotationsSettings = React.createContext({});

const AnnotationsProvider = ({ children, init, updater }) => {
	const [annotations, _setAnnotations] = useState(init);

	const setAnnotations = useCallback((val) => {
		_setAnnotations(val);
		updater(val);
		window?.zoteroRoam?.updateSetting?.("annotations", val);
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
	{ label: "Don't group", value: false }
];

const USE_OPTIONS = [
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
			use
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
			updateUseFormat: (val) => updateSingleValue("use", val)
		};
	}, [setOpts]);

	return <>
		<TextField description="Content to insert at the beginning of a comment block (default: '')" ifEmpty={true} label="Enter a prefix value for comment blocks" onChange={handlers.updateCommentPrefix} title="Comment Prefix" value={comment_prefix} />
		<TextField description="Content to insert at the end of a comment block (default: '')" ifEmpty={true} label="Enter a suffix value for comment blocks" onChange={handlers.updateCommentSuffix} title="Comment Suffix" value={comment_suffix} />
		<TextField description="Content to insert at the beginning of a highlight block (default: '[[>]]')" ifEmpty={true} label="Enter a prefix value for highlight blocks" onChange={handlers.updateHighlightPrefix} title="Highlight Prefix" value={highlight_prefix} />
		<TextField description="Content to insert at the end of a highlight block (default: '([p. {{page_label}}]({{link_page}})) {{tags_string}}')" ifEmpty={true} label="Enter a suffix value for highlight blocks" onChange={handlers.updateHighlightSuffix} title="Highlight Suffix" value={highlight_suffix} />
		<TextField description="Enter the name of a custom function, or leave blank to use the default formatter" ifEmpty={true} label="Enter the name of the function to use for formatting annotations" onChange={handlers.updateFuncName} placeholder="Type a function's name" title="Formatting function" value={func} />
		<SingleInput description="Select how annotations should be grouped at import" menuTitle="Select whether annotations should be grouped" onChange={handlers.updateGroupBy} options={GROUP_BY_OPTIONS} title="Group By" value={group_by} />
		<SingleInput description="The format in which the annotations should be passed to the formatting function" menuTitle="Select an input format" onChange={handlers.updateUseFormat} options={USE_OPTIONS} title="Receive annotations as" value={use} />
	</>;
}

export {
	AnnotationsProvider,
	AnnotationsWidget,
	useAnnotationsSettings
};