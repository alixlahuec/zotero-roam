import { func as funcType, node } from "prop-types";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { RowGroup, RowGroupOption, SingleInput, TextField, TextWithSelect } from "../common";

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

const NEST_PRESET_OPTIONS = [
	{ label: "Don't nest", value: false },
	{ label: "[[Notes]]", value: "[[Notes]]" }
];

const NEST_USE_OPTIONS = {
	"preset": "Preset",
	"custom": "Custom content"
};

const SPLIT_PRESET_OPTIONS = [
	{ label: "Newline", value: "\n" },
	{ label: "Paragraph", value: "</p>" }
];

const SPLIT_USE_OPTIONS = {
	"preset": "Preset",
	"custom": "Custom separator"
};

const USE_OPTIONS = {
	"default": "Default formatter",
	"function": "Custom function"
};

const WITH_OPTIONS = [
	{ label: "Use raw metadata", value: "raw" },
	{ label: "Use HTML blocks", value: "text" }
];


function NotesWidget(){
	const [
		{
			func,
			nest_char,
			nest_preset,
			nest_use,
			split_char,
			split_preset,
			split_use,
			use,
			__with
		},
		setOpts
	] = useNotesSettings();

	const handlers = useMemo(() => {
		/* istanbul ignore next */
		function updateSingleValue(op, val){
			setOpts(prevState => ({
				...prevState,
				[op]: val
			}));
		}

		return {
			updateFuncName: (val) => updateSingleValue("func", val),
			updateNestChar: (val) => updateSingleValue("nest_char", val),
			updateNestPreset: (val) => updateSingleValue("nest_preset", val),
			updateNestUse: (val) => updateSingleValue("nest_use", val),
			updateSplitChar: (val) => updateSingleValue("split_char", val),
			updateSplitPreset: (val) => updateSingleValue("split_preset", val),
			updateSplitUse: (val) => updateSingleValue("split_use", val),
			updateUseType: (val) => updateSingleValue("use", val),
			updateWithFormat: (val) => updateSingleValue("__with", val)
		};
	}, [setOpts]);

	const customFuncButtonProps = useMemo(() => ({
		intent: "primary"
	}), []);

	return <>
		<RowGroup title="Divider"
			description="The character(s) on which to split up notes into blocks"
			onChange={handlers.updateSplitUse}
			options={SPLIT_USE_OPTIONS}
			selected={split_use} >
			<RowGroupOption id="preset">
				<SingleInput menuTitle="Select a separator preset" onChange={handlers.updateSplitPreset} options={SPLIT_PRESET_OPTIONS} value={split_preset} />
			</RowGroupOption>
			<RowGroupOption id="custom" description="Special characters, like \n are not allowed." >
				<TextField ifEmpty={true} label="Enter a custom separator" onChange={handlers.updateSplitChar} placeholder="e.g, </p>" value={split_char} />
			</RowGroupOption>
		</RowGroup>
		<RowGroup title="Formatter"
			description="Choose a way to format notes when importing from Zotero." 
			onChange={handlers.updateUseType}
			options={USE_OPTIONS}
			selected={use}>
			<RowGroupOption id="default" />
			<RowGroupOption id="function" description="Enter the name of a custom function, and choose the type of input it should receive.">
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
		<RowGroup title="Nesting"
			description="Pick how to add notes to the Roam page." 
			onChange={handlers.updateNestUse}
			options={NEST_USE_OPTIONS}
			selected={nest_use}>
			<RowGroupOption id="preset">
				<SingleInput menuTitle="Select a nesting preset" onChange={handlers.updateNestPreset} options={NEST_PRESET_OPTIONS} value={nest_preset} />
			</RowGroupOption>
			<RowGroupOption id="custom" description="Enter the contents of the block under which notes should be nested">
				<TextField ifEmpty={true} label="Enter the block's contents" onChange={handlers.updateNestChar} placeholder="e.g, [[Notes]]" value={nest_char} />
			</RowGroupOption>
		</RowGroup>
	</>;
}

export {
	NotesProvider,
	NotesWidget,
	useNotesSettings
};