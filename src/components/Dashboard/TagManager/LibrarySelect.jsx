import React, { useCallback} from "react";
import { arrayOf, func, shape, string } from "prop-types";
import { Button } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";

import * as customPropTypes from "../../../propTypes";

const popoverProps = {
	minimal: true,
	popoverClassName: "zr-popover"
};

const LibrarySelect = React.memo(function LibrarySelect({ libProps }){
	const { currentLibrary: { path }, onSelect, options } = libProps;
	const handleSelect = useCallback((event) => {
		let value = event.currentTarget?.value;
		if(value){ onSelect(value); }
	}, [onSelect]);

	return (
		<Select 
			filterable={false}
			items={options} 
			onItemSelect={handleSelect} 
			placement="bottom-right"
			popoverProps={popoverProps}>
			<Button className="zr-text-small" icon="double-caret-vertical" minimal={true} text={path} />
		</Select>
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
