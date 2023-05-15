import { useMemo } from "react";
import { Intent } from "@blueprintjs/core";
import { RowGroup, RowGroupOption, TextField, TextWithSelect, SettingsManager } from "Components/UserSettings";


const { Provider: MetadataProvider, useSettings: useMetadataSettings } = new SettingsManager<"metadata">();

const PARAM_OPTIONS = [
	{ label: "By name", value: "srcName" },
	{ label: "By UID", value: "srcUid" }
];

const USE_OPTIONS = {
	"default": "Default formatter",
	"function": "Custom function",
	"smartblock": "SmartBlock"
};

function MetadataWidget(){
	const [
		{
			func,
			smartblock: {
				param,
				paramValue
			},
			use
		},
		setOpts
	] = useMetadataSettings();

	const handlers = useMemo(() => {
		function updateSingleValue(op, val){
			setOpts(prevState => ({
				...prevState,
				[op]: val
			}));
		}

		function updateSmartblock(prop, val){
			const returnValue = prop == "param"
				? { param: val, paramValue: "" }
				: { paramValue: val };

			setOpts(prevState => ({
				...prevState,
				smartblock: {
					...prevState.smartblock,
					...returnValue
				}
			}));
		}

		return {
			updateFuncName: (val) => updateSingleValue("func", val),
			updateSmartblockParam: (val) => updateSmartblock("param", val),
			updateSmartblockParamValue: (val) => updateSmartblock("paramValue", val),
			updateUse: (val) => updateSingleValue("use", val)
		};
	}, [setOpts]);

	const smartblockButtonProps = useMemo(() => ({
		intent: Intent.PRIMARY
	}), []);

	return (
		<RowGroup title="Formatter" 
			description="Choose a way to format item metadata when importing from Zotero." 
			onChange={handlers.updateUse}
			options={USE_OPTIONS} 
			selected={use}>
			<RowGroupOption id="default" />
			<RowGroupOption id="function" description="Enter the name of a custom function to use">
				<TextField ifEmpty={true} label="Enter the name of the function to use for formatting metadata" onChange={handlers.updateFuncName} placeholder="e.g, myFunction" value={func} />
			</RowGroupOption>
			<RowGroupOption id="smartblock" description="Choose a SmartBlock template">
				<TextWithSelect 
					onSelectChange={handlers.updateSmartblockParam} 
					onValueChange={handlers.updateSmartblockParamValue} 
					placeholder="Enter a value" 
					selectButtonProps={smartblockButtonProps} 
					selectOptions={PARAM_OPTIONS}
					selectValue={param} 
					textValue={paramValue} 
					inputLabel={"Enter the SmartBlock's" + (param == "srcName" ? "name" : "UID")} 
					selectLabel="Select the property to use to identify the SmartBlock" />
			</RowGroupOption>
		</RowGroup>
	);
}

export {
	MetadataProvider,
	MetadataWidget,
	useMetadataSettings
};