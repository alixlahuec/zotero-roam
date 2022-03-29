import React, { useCallback } from "react";
import { arrayOf, bool, oneOf, oneOfType, shape, string } from "prop-types";
import { Menu, MenuItem } from "@blueprintjs/core";

import MergeAsOptions from "./MergeAsOptions";
import { useDeleteTags } from "../../../api/write";

import * as customPropTypes from "../../../propTypes";

function ActionsMenu({ deleteTags = true, library, mergeAs = true, suggestion }) {
	const { mutate, status } = useDeleteTags();

	const triggerDelete = useCallback(() => {
		mutate({
			library,
			tags: [...suggestion.use.roam, ...suggestion.use.zotero]
		});
	}, [suggestion.use, library, mutate]);

	return (
		<Menu className="zr-text-small">
			{mergeAs && suggestion.type 
				? <MenuItem disabled={status == "loading"} icon="group-objects" text="Merge as...">
					<MergeAsOptions library={library} options={suggestion.use} />
				</MenuItem>
				: null}
			{deleteTags
				? <MenuItem disabled={status == "loading"} icon="trash" intent="danger" text="Delete tag(s)" onClick={triggerDelete} />
				: null}
		</Menu>
	);
}
ActionsMenu.propTypes = {
	deleteTags: bool,
	library: customPropTypes.zoteroLibraryType,
	mergeAs: bool,
	suggestion: shape({
		recommend: oneOfType([string, oneOf([null])]),
		type: oneOf(["auto", "manual", null]),
		use: shape({
			roam: arrayOf(string),
			zotero: arrayOf(string)
		})
	})
};

export default ActionsMenu;
