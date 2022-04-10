import React, { useCallback, useMemo } from "react";
import { arrayOf, func } from "prop-types";
import { RadioGroup } from "@blueprintjs/core";

import * as customPropTypes from "../../propTypes";

const LibrarySelector = React.memo(function LibrarySelector({ libraries, selectedLib, onSelect }) {
	const options = useMemo(() => {
		return libraries.map(lib => { return { value: lib.path }; });
	}, [libraries]);

	const handleSelection = useCallback((event) => {
		onSelect(libraries.find(lib => lib.path == event.currentTarget.value));
	}, [libraries, onSelect]);

	return (
		<RadioGroup 
			className="zr-text-small"
			inline={false}
			name="import-library"
			onChange={handleSelection}
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
