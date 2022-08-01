import React, { useCallback, useContext, useMemo, useState } from "react";
import { func as funcType, node } from "prop-types";

import { SingleInput, TextField } from "../common";

import * as customPropTypes from "../../../propTypes";

const NotesSettings = React.createContext({});

const NotesProvider = ({ children, init, updater }) => {
	const [notes, _setNotes] = useState(init);

	const setNotes = useCallback((updateFn) => {
		_setNotes((prevState) => {
			const update = updateFn(prevState);
			updater(update);
			window?.zoteroRoam?.updateSetting?.("notes", update);
			return update;
		});
	}, [updater]);

	const contextValue = useMemo(() => [notes, setNotes], [notes, setNotes]);

	return (
		<NotesSettings.Provider value={contextValue}>
			{children}
		</NotesSettings.Provider>
	);
};
NotesProvider.propTypes = {
	children: node,
	init: customPropTypes.notesSettingsType,
	updater: funcType
};

const useNotesSettings = () => {
	const context = useContext(NotesSettings);

	return context;
};

const USE_OPTIONS = [
	{ label: "Raw metadata", value: "raw" },
	{ label: "Text contents", value: "text" }
];

// TODO: switch divider input to be preselect values (inc. \n) vs text
function NotesWidget(){
	const [
		{
			func,
			split_char,
			use
		},
		setOpts
	] = useNotesSettings();

	const handlers = useMemo(() => {
		function updateSingleValue(op, val){
			setOpts(prevState => ({
				...prevState,
				[op]: val
			}));
		}

		return {
			updateFuncName: (val) => updateSingleValue("func", val),
			updateSplitChar: (val) => updateSingleValue("split_char", val),
			updateUseFormat: (val) => updateSingleValue("use", val)
		};
	}, [setOpts]);

	return <>
		<TextField description="Enter the name of a custom function, or leave blank to use the default formatter" ifEmpty={true} label="Enter the name of the function to use for formatting notes" onChange={handlers.updateFuncName} placeholder="Type a function's name" title="Formatting function" value={func} />
		<TextField description="The character(s) on which to split up notes into blocks" ifEmpty={true} label="Enter a character or set of characters to use to split notes into blocks" onChange={handlers.updateSplitChar} title="Divider" value={split_char} />
		<SingleInput description="The format in which the notes should be passed to the formatting function" menuTitle="Select an input format" onChange={handlers.updateUseFormat} options={USE_OPTIONS} title="Receive notes as" value={use} />
	</>;
}

export {
	NotesProvider,
	NotesWidget,
	useNotesSettings
};