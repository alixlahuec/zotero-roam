import { func, node, objectOf, string } from "prop-types";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { TextField } from "../common";
import { camelToTitleCase } from "../../../utils";


const TypemapSettings = createContext({});

const TypemapProvider = ({ children, init, updater }) => {
	const [typemap, _setTypemap] = useState(init);

	const setTypemap = useCallback((updateFn) => {
		_setTypemap((prevState) => {
			const update = updateFn(prevState);
			updater(update);
			window?.zoteroRoam?.updateSetting?.("typemap", update);
			return update;
		});
	}, [updater]);

	const contextValue = useMemo(() => [typemap, setTypemap], [typemap, setTypemap]);

	return (
		<TypemapSettings.Provider value={contextValue}>
			{children}
		</TypemapSettings.Provider>
	);
};
TypemapProvider.propTypes = {
	children: node,
	init: objectOf(string),
	updater: func
};

const useTypemapSettings = () => {
	const context = useContext(TypemapSettings);

	return context;
};

function TypemapWidget(){
	const [
		typemap,
		setOpts
	] = useTypemapSettings();

	const updateValue = useCallback((type, val) => {
		setOpts(prevState => ({
			...prevState,
			[type]: val
		}));
	}, [setOpts]);

	return Object.keys(typemap).map(type => (
		<TextField key={type} ifEmpty={true} label={"Enter a mapping for" + camelToTitleCase(type)} onChange={(val) => updateValue(type, val)} title={type} value={typemap[type]} />
	));
}

export {
	TypemapProvider,
	TypemapWidget,
	useTypemapSettings
};