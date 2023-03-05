import { func as funcType, node } from "prop-types";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { RowGroup, RowGroupOption, TextField, TextWithSelect } from "../common";

import * as customPropTypes from "../../../propTypes";


const MetadataSettings = createContext({});

const MetadataProvider = ({ children, init, updater }) => {
	const [metadata, _setMetadata] = useState(init);

	const setMetadata = useCallback((updateFn) => {
		_setMetadata((prevState) => {
			const update = updateFn(prevState);
			updater(update);
			return update;
		});
	}, [updater]);

	const contextValue = useMemo(() => [metadata, setMetadata], [metadata, setMetadata]);

	return (
		<MetadataSettings.Provider value={contextValue}>
			{children}
		</MetadataSettings.Provider>
	);
};
MetadataProvider.propTypes = {
	children: node,
	init: customPropTypes.metadataSettingsType,
	updater: funcType
};

const useMetadataSettings = () => {
	const context = useContext(MetadataSettings);

	return context;
};

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
		intent: "primary"
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