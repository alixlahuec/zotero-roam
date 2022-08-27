import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { func as funcType, node } from "prop-types";

import { RowGroup, RowGroupOption, TextField, TextWithSelect } from "../common";

import * as customPropTypes from "../../../propTypes";

const NotesSettings = createContext({});

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

const USE_OPTIONS = {
	"default": "Default formatter",
	"function": "Custom function"
};

const WITH_OPTIONS = [
	{ label: "Raw metadata", value: "raw" },
	{ label: "Text contents", value: "text" }
];


function NotesWidget(){
	const [
		{
			func,
			split_char,
			use,
			__with
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
			updateUseType: (val) => updateSingleValue("use", val),
			updateWithFormat: (val) => updateSingleValue("__with", val)
		};
	}, [setOpts]);

	const customFuncButtonProps = useMemo(() => ({
		intent: "primary"
	}), []);

	return <>
		<TextField description="The character(s) on which to split up notes into blocks" ifEmpty={true} label="Enter a character or set of characters to use to split notes into blocks" onChange={handlers.updateSplitChar} placeholder="e.g \n, </p>" title="Divider" value={split_char} />
		<RowGroup title="Formatter"
			description="Choose a way to format annotations metadata when importing from Zotero." 
			onChange={handlers.updateUseType}
			options={USE_OPTIONS}
			selected={use}>
			<RowGroupOption id="default" />
			<RowGroupOption id="function" description="Enter the name of a custom function">
				<TextWithSelect 
					onSelectChange={handlers.updateWithFormat} 
					onValueChange={handlers.updateFuncName} 
					placeholder="e.g, myFunction" 
					selectButtonProps={customFuncButtonProps} 
					selectOptions={WITH_OPTIONS} 
					selectValue={__with} 
					textValue={func} 
					inputLabel="Enter the name of the function to use for formatting notes" 
					selectLabel="Select an input format for your custom function" />
			</RowGroupOption>
		</RowGroup>
	</>;
}

export {
	NotesProvider,
	NotesWidget,
	useNotesSettings
};