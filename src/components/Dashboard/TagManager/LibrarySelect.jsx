import React, { useCallback} from "react";
import { arrayOf, func, shape, string } from "prop-types";
import { FormGroup, HTMLSelect } from "@blueprintjs/core";

import * as customPropTypes from "../../../propTypes";

const LibrarySelect = React.memo(function LibrarySelect({ libProps }){
	const { currentLibrary: { path }, onSelect, options } = libProps;
	const handleSelect = useCallback((event) => {
		let value = event.currentTarget?.value;
		if(value){ onSelect(value); }
	}, [onSelect]);

	return (
		<FormGroup
			className="zr-text-small"
			inline={true}
			label="Library :"
			labelFor="zr-select--library">
			<HTMLSelect id="zr-select--library" minimal={true} onChange={handleSelect} options={options} value={path} />
		</FormGroup>
	);
});
LibrarySelect.propTypes = {
	libProps: shape({
		currentLibrary: customPropTypes.zoteroLibraryType,
		onSelect: func,
		options: arrayOf(string)
	})
};

export default LibrarySelect;
