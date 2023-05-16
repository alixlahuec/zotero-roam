import { useMemo } from "react";
import { Intent } from "@blueprintjs/core";
import { RowGroup, RowGroupOption, SingleInput, TextField, TextWithSelect, SettingsManager } from "Components/UserSettings";


const { Provider: NotesProvider, useSettings: useNotesSettings } = new SettingsManager<"notes">({
	/* istanbul ignore next */
	afterUpdate: (_prevState, update) => {
		window?.zoteroRoam?.updateSetting?.("notes", update);
	}
});

const NEST_POSITION_OPTIONS = [
	{ label: "At the top", value: "top" },
	{ label: "At the bottom", value: "bottom" }
];

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
			nest_position,
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
			updateNestPosition: (val) => updateSingleValue("nest_position", val),
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
		intent: Intent.PRIMARY
	}), []);

	return <>
		<RowGroup title="Divider"
			description="The character(s) on which to split up notes into blocks"
			onChange={handlers.updateSplitUse}
			options={SPLIT_USE_OPTIONS}
			selected={split_use} >
			<RowGroupOption id="preset">
				<SingleInput menuTitle="Select a separator preset" onSelect={handlers.updateSplitPreset} options={SPLIT_PRESET_OPTIONS} value={split_preset} />
			</RowGroupOption>
			<RowGroupOption id="custom" description="Special characters, like \n, are not allowed." >
				<TextField ifEmpty={true} label="Enter a custom separator" onChange={handlers.updateSplitChar} placeholder="e.g, </p>" value={split_char} />
			</RowGroupOption>
		</RowGroup>
		<RowGroup title="Formatter"
			description="Choose a way to format notes when importing from Zotero." 
			onChange={handlers.updateUseType}
			options={USE_OPTIONS}
			selected={use}>
			<RowGroupOption id="default" />
			<RowGroupOption id="function" description="Enter the inputs and name of your custom function.">
				<TextWithSelect 
					onSelectChange={handlers.updateWithFormat} 
					onValueChange={handlers.updateFuncName} 
					placeholder="e.g, myFunction" 
					selectButtonProps={customFuncButtonProps} 
					selectOptions={WITH_OPTIONS} 
					selectValue={__with} 
					textValue={func} 
					inputLabel="Enter the name of your custom function for formatting notes" 
					selectLabel="Select an input format for your custom function" />
			</RowGroupOption>
		</RowGroup>
		<RowGroup title="Nesting"
			description="Pick how to add notes to the Roam page." 
			onChange={handlers.updateNestUse}
			options={NEST_USE_OPTIONS}
			selected={nest_use}>
			<RowGroupOption id="preset">
				<SingleInput menuTitle="Select a nesting preset" onSelect={handlers.updateNestPreset} options={NEST_PRESET_OPTIONS} value={nest_preset} />
			</RowGroupOption>
			<RowGroupOption id="custom" description="Enter the contents of the block under which notes should be nested">
				<TextField ifEmpty={true} label="Enter the block's contents" onChange={handlers.updateNestChar} placeholder="e.g, [[Notes]]" value={nest_char} />
			</RowGroupOption>
		</RowGroup>
		<SingleInput description="The position at which to insert the blocks" menuTitle="Select a position" onSelect={handlers.updateNestPosition} options={NEST_POSITION_OPTIONS} title="Position" value={nest_position} />
	</>;
}

export {
	NotesProvider,
	NotesWidget,
	useNotesSettings
};