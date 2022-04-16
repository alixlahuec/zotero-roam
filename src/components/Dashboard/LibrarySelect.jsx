import React from "react";
import { arrayOf, func, shape, string } from "prop-types";
import { Button, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";

import * as customPropTypes from "../../propTypes";

const popoverProps = {
	minimal: true,
	popoverClassName: "zr-popover"
};

function itemRenderer(item, itemProps) {
	const { handleClick/*, modifiers: { active }*/ } = itemProps;

	return <MenuItem key={item} onClick={handleClick} text={item} />;
}

const LibrarySelect = React.memo(function LibrarySelect({ libProps }){
	const { currentLibrary: { path }, onSelect, options } = libProps;

	return (
		<Select 
			filterable={false}
			itemRenderer={itemRenderer}
			items={options} 
			onItemSelect={onSelect} 
			placement="bottom-right"
			popoverProps={popoverProps}>
			<Button 
				className={["zr-dashboard--library-select", "zr-auxiliary", "zr-text-small"].join(" ")} 
				icon="folder-open"
				minimal={true} 
				text={path} />
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
