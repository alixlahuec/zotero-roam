import React, { useCallback, useContext, useMemo, useState } from "react";
import { func as funcType, node } from "prop-types";

import { TextField, TextWithSelect } from "../common";

import * as customPropTypes from "../../../propTypes";

const MetadataSettings = React.createContext({});

const MetadataProvider = ({ children, init, updater }) => {
	const [metadata, _setMetadata] = useState(init);

	const setMetadata = useCallback((val) => {
		_setMetadata(val);
		updater(val);
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

const USE_OPTIONS = [
	{ label: "Function", value: "function" },
	{ label: "SmartBlock", value: "smartblock" }
];

// TODO: make func vs smartblock conditional, based on {use}
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
			updateSmartblockParamValue: (val) => updateSmartblock("paramValue", val)
		};
	}, [setOpts]);

	const smartblockButtonProps = useMemo(() => ({
		intent: "primary",
		rightIcon: "caret-down"
	}), []);

	return <>
		<TextField description="Enter the name of a custom function, or leave blank to use the default formatter" ifEmpty={true} label="Enter the name of the function to use for formatting metadata" onChange={handlers.updateFuncName} placeholder="Type a function's name" title="Formatting function" value={func} />
		<TextWithSelect 
			description="Choose the SmartBlock to use for formatting metadata" 
			onSelectChange={handlers.updateSmartblockParam} 
			onValueChange={handlers.updateSmartblockParamValue} 
			placeholder="Enter a value" 
			selectButtonProps={smartblockButtonProps} 
			selectOptions={PARAM_OPTIONS} 
			selectValue={param} 
			textValue={paramValue} 
			title="SmartBlock" 
			inputLabel={"Enter the SmartBlock's" + (param == "srcName" ? "Name" : "UID")} 
			selectLabel="Select the property to use to identify the SmartBlock" />
	</>;
}

export {
	MetadataProvider,
	MetadataWidget,
	useMetadataSettings
};