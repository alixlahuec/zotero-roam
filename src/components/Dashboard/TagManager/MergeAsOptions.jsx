import React, { useCallback } from "react";
import { arrayOf, shape, string } from "prop-types";
import { MenuDivider, MenuItem, Tag } from "@blueprintjs/core";

import { useModifyTags } from "../../../api/write";

import * as customPropTypes from "../../../propTypes";

function MergeAsOptions({ library, options }) {
	const { roam = [], zotero = [] } = options;
	const { mutate, status } = useModifyTags();

	const triggerMerge = useCallback((value) => {
		mutate({
			into: value,
			library,
			tags: [...roam, ...zotero]
		}, {
			onSettled: (data, error, variables) => console.log(data, error, variables)
		});
	}, [library, mutate, roam, zotero]);

	return (
		<>
			{roam.map(el => (
				<MenuItem key={el} 
					disabled={["error", "success", "loading"].includes(status)}
					labelElement={<Tag intent="success" minimal={true}>In Roam</Tag>}
					multiline={true}
					onClick={() => triggerMerge(el)}
					text={el} 
				/>))}
			{zotero.map(el => <MenuItem key={el} multiline={true} text={el} />)}
			<MenuDivider />
			<MenuItem
				disabled={["error", "success", "loading"].includes(status)}
				intent="primary"
				multiline={true}
				text="Choose custom value..."
			/>
		</>
	);
}
MergeAsOptions.propTypes = {
	library: customPropTypes.zoteroLibraryType,
	options: shape({
		roam: arrayOf(string),
		zotero: arrayOf(string)
	})
};

export default MergeAsOptions;
