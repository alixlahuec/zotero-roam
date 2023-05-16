import { useMemo } from "react";
import { Intent } from "@blueprintjs/core";
import { Definition, RowCol, RowGroup, RowGroupOption, SingleInput, TextAreaInput, TextWithSelect, SettingsManager } from "Components/UserSettings";


const { Provider: AnnotationsProvider, useSettings: useAnnotationsSettings } = new SettingsManager<"annotations">({
	/* istanbul ignore next */
	afterUpdate: (_prevState, update) => {
		window?.zoteroRoam?.updateSetting?.("annotations", update);
	}
});

const GROUP_BY_OPTIONS = [
	{ label: "Group by date added", value: "dateAdded" },
	{ label: "Don't group annotations", value: false }
];

const USE_OPTIONS = {
	"default": "Default formatter",
	"function": "Custom function"
};

const WITH_OPTIONS = [
	{ label: "Use raw metadata", value: "raw" },
	{ label: "Use simplified data", value: "formatted" }
];

const COMMENT_REPLACEMENTS = (
	<>
		Replacements available:
		<Definition item="{{comment}}" text="the comment's text" />
	</>
);

const HIGHLIGHT_REPLACEMENTS = (
	<>
		Replacements available:
		<Definition item="{{highlight}}" text="the highlighted text" />
		<Definition item="{{page_label}}" text="the page number" />
		<Definition item="{{link_page}}" text="the link to the PDF page" />
		<Definition item="{{tags_string}}" text="the tags associated with the highlight (comma-separated)" />
	</>
);

function AnnotationsWidget(){
	const [
		{
			func,
			group_by,
			template_comment,
			template_highlight,
			use,
			__with
		},
		setOpts
	] = useAnnotationsSettings();

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
			updateGroupBy: (val) => updateSingleValue("group_by", val),
			updateTemplateComment: (val) => updateSingleValue("template_comment", val),
			updateTemplateHighlight: (val) => updateSingleValue("template_highlight", val),
			updateUseType: (val) => updateSingleValue("use", val),
			updateWithFormat: (val) => updateSingleValue("__with", val)
		};
	}, [setOpts]);

	const customFuncButtonProps = useMemo(() => ({
		intent: Intent.PRIMARY
	}), []);

	return <>
		<RowCol title="Comment Template" description={COMMENT_REPLACEMENTS} >
			<TextAreaInput label="Enter a template for comment blocks" onChange={handlers.updateTemplateComment} value={template_comment} />
		</RowCol>
		<RowCol title="Highlight Template" description={HIGHLIGHT_REPLACEMENTS} >
			<TextAreaInput label="Enter a template for highlight blocks" onChange={handlers.updateTemplateHighlight} value={template_highlight} />
		</RowCol>
		<RowGroup title="Formatter"
			description="Choose a way to format annotations metadata when importing from Zotero."
			onChange={handlers.updateUseType} 
			options={USE_OPTIONS} 
			selected={use}>
			<RowGroupOption id="default">
				<SingleInput menuTitle="Select whether annotations should be grouped" onSelect={handlers.updateGroupBy} options={GROUP_BY_OPTIONS} value={group_by} />
			</RowGroupOption>
			<RowGroupOption id="function" description="Enter the inputs and name of your custom function.">
				<TextWithSelect 
					onSelectChange={handlers.updateWithFormat} 
					onValueChange={handlers.updateFuncName} 
					placeholder="e.g, myFunction" 
					selectButtonProps={customFuncButtonProps} 
					selectOptions={WITH_OPTIONS} 
					selectValue={__with} 
					textValue={func} 
					inputLabel="Enter the name of your custom function for formatting annotations" 
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