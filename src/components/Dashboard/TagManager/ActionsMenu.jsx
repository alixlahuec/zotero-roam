import { arrayOf, bool, oneOf, oneOfType, shape, string } from "prop-types";
import { useCallback } from "react";

import { Menu, MenuItem } from "@blueprintjs/core";

import MergeAsOptions from "./MergeAsOptions";
import { useDeleteTags } from "../../../api/tags";

import * as customPropTypes from "../../../propTypes";
import { CustomClasses } from "../../../constants";


function ActionsMenu({ deleteTags = true, library, mergeAs = true, suggestion }) {
	const { mutate, status } = useDeleteTags();

	const triggerDelete = useCallback(() => {
		mutate({
			library,
			tags: [...suggestion.use.roam, ...suggestion.use.zotero]
		});
	}, [suggestion.use, library, mutate]);

	return (
		<Menu className={CustomClasses.TEXT_SMALL}>
			{mergeAs && suggestion.type 
				? <MenuItem disabled={["loading", "success"].includes(status)} icon="group-objects" text="Merge as">
					<MergeAsOptions library={library} options={suggestion.use} />
				</MenuItem>
				: null}
			{deleteTags
				? <MenuItem disabled={["loading", "success"].includes(status)} icon={status == "success" ? "tick" : "trash"} intent="danger" text={status == "success" ? "Deleted" : "Delete tag(s)"} onClick={triggerDelete} />
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
