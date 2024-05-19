import { useCallback } from "react";
import { Menu, MenuItem } from "@blueprintjs/core";

import MergeAsOptions from "./MergeAsOptions";

import { useDeleteTags } from "@clients/zotero";

import { CustomClasses } from "../../../constants";
import { ZLibrary, ZTagSuggestion } from "Types/transforms";


type OwnProps = {
	deleteTags?: boolean,
	library: ZLibrary,
	mergeAs?: boolean,
	suggestion: ZTagSuggestion
};

function ActionsMenu({ deleteTags = true, library, mergeAs = true, suggestion }: OwnProps) {
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


export default ActionsMenu;
