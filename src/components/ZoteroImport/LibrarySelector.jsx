import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { RadioGroup } from "@blueprintjs/core";

import * as customPropTypes from "../../propTypes";

const LibrarySelector = React.memo(function LibrarySelector(props) {
	const { libraries, onSelect, selectedLib } = props;

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
	libraries: PropTypes.arrayOf(customPropTypes.zoteroLibraryType),
	onSelect: PropTypes.func,
	selectedLib: customPropTypes.zoteroLibraryType
};

export default LibrarySelector;
