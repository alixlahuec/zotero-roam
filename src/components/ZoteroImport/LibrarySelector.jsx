import { memo, useMemo } from "react";
import { arrayOf, func } from "prop-types";
import { RadioGroup } from "@blueprintjs/core";

import { CustomClasses } from "../../constants";

import * as customPropTypes from "../../propTypes";


const LibrarySelector = memo(function LibrarySelector({ libraries, selectedLib, onSelect }) {
	const options = useMemo(() => {
		return libraries.map(lib => { return { value: lib.path }; });
	}, [libraries]);

	return (
		<RadioGroup 
			className={CustomClasses.TEXT_SMALL}
			inline={false}
			name="import-library"
			onChange={onSelect}
			options={options}
			selectedValue={selectedLib.path}/>
	);
});
LibrarySelector.propTypes = {
	libraries: arrayOf(customPropTypes.zoteroLibraryType),
	onSelect: func,
	selectedLib: customPropTypes.zoteroLibraryType
};

export default LibrarySelector;
