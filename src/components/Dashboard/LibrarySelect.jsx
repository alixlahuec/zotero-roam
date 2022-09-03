import { arrayOf, func, shape, string } from "prop-types";
import { memo } from "react";

import { Button, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";

import { CustomClasses } from "../../constants";

import * as customPropTypes from "../../propTypes";

const popoverProps = {
	minimal: true,
	placement: "bottom-right",
	popoverClassName: CustomClasses.POPOVER
};

function itemRenderer(item, itemProps) {
	const { handleClick/*, modifiers: { active }*/ } = itemProps;

	return <MenuItem key={item} onClick={handleClick} text={item} />;
}

const LibrarySelect = memo(function LibrarySelect({ libProps }){
	const { currentLibrary: { path }, onSelect, options } = libProps;

	return (
		<Select
			filterable={false}
			itemRenderer={itemRenderer}
			items={options} 
			matchTargetWidth={true}
			onItemSelect={onSelect}
			popoverProps={popoverProps}>
			<Button 
				className={["zr-dashboard--library-select", CustomClasses.TEXT_AUXILIARY, CustomClasses.TEXT_SMALL].join(" ")} 
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
