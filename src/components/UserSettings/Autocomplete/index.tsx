import { useMemo } from "react";
import { SettingsManager, Definition, RowGroup, RowGroupOption, SingleInput, TextField } from "Components/UserSettings";


const { Provider: AutocompleteProvider, useSettings: useAutocompleteSettings } = new SettingsManager<"autocomplete">();

const DISPLAY_OPTIONS = [
	{ label: "Citekey", value: "citekey" },
	{ label: "Zettlr", value: "zettlr" }
];

const DISPLAY_USE_OPTIONS = {
	"preset": "Preset",
	"custom": "Custom template"
};

const FORMAT_OPTIONS = [
	{ label: "Citation", value: "citation" },
	{ label: "Citekey", value: "citekey" },
	{ label: "Citekey (raw)", value: "key" },
	{ label: "Page reference", value: "pageref" },
	{ label: "Popover", value: "popover" },
	{ label: "Tag", value: "tag" }
];

const FORMAT_USE_OPTIONS = {
	"preset": "Preset",
	"custom": "Custom template"
};

const AUTOCOMPLETE_REPLACEMENTS = (
	<>
		Replacements available:
		<Definition item="{{authors}}" text="Author et al." />
		<Definition item="{{citekey}}" text="@someCitekey" />
		<Definition item="{{key}}" text="someCitekey" />
		<Definition item="{{summary}}" text="Author et al. (2023)" />
		<Definition item="{{summary_or_key}}" />
		<Definition item="{{title}}" />
		<Definition item="{{year}}" />
	</>
);

function AutocompleteWidget(){
	const [
		{
			display_char,
			display_use,
			display,
			format_char,
			format_use,
			format,
			trigger
		}, 
		setOpts
	] = useAutocompleteSettings();

	const handlers = useMemo(() => {
		/* istanbul ignore next */
		function updateSingleValue(op, val){
			setOpts(prevState => ({
				...prevState,
				[op]: val
			}));
		}

		return {
			updateDisplayChar: (val) => updateSingleValue("display_char", val),
			updateDisplayUse: (val) => updateSingleValue("display_use", val),
			updateDisplay: (val) => updateSingleValue("display", val),
			updateFormatChar: (val) => updateSingleValue("format_char", val),
			updateFormatUse: (val) => updateSingleValue("format_use", val),
			updateFormat: (val) => updateSingleValue("format", val),
			updateTrigger: (val) => updateSingleValue("trigger", val)
		};
	}, [setOpts]);

	return <>
		<TextField description="The character(s) that should trigger the autocomplete. If no value is provided, the feature will be disabled." ifEmpty={true} label="Enter a trigger for the 'autocomplete' feature" onChange={handlers.updateTrigger} placeholder="e.g, @" title="Trigger" value={trigger} />
		<RowGroup title="Display"
			description="How suggestions should be displayed in the autocomplete menu"
			onChange={handlers.updateDisplayUse}
			options={DISPLAY_USE_OPTIONS}
			selected={display_use} >
			<RowGroupOption id="preset">
				<SingleInput menuTitle="Select a display preset" onSelect={handlers.updateDisplay} options={DISPLAY_OPTIONS} value={display} />
			</RowGroupOption>
			<RowGroupOption alignToBaseline={true} id="custom" description={AUTOCOMPLETE_REPLACEMENTS} >
				<TextField ifEmpty={true} label="Enter a custom template" onChange={handlers.updateDisplayChar} placeholder="e.g, {{key}}" value={display_char} />
			</RowGroupOption>
		</RowGroup>
		<RowGroup title="Format"
			description="How references should be inserted into the current Roam block"
			onChange={handlers.updateFormatUse}
			options={FORMAT_USE_OPTIONS}
			selected={format_use} >
			<RowGroupOption id="preset">
				<SingleInput menuTitle="Select a format preset" onSelect={handlers.updateFormat} options={FORMAT_OPTIONS} value={format} />
			</RowGroupOption>
			<RowGroupOption alignToBaseline={true} id="custom" description={AUTOCOMPLETE_REPLACEMENTS} >
				<TextField ifEmpty={true} label="Enter a custom template" onChange={handlers.updateFormatChar} placeholder="e.g, {{key}}" value={format_char} />
			</RowGroupOption>
		</RowGroup>
	</>;
}

export {
	AutocompleteProvider,
	AutocompleteWidget,
	useAutocompleteSettings
};