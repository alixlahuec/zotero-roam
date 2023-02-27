import { arrayOf, oneOf, oneOfType, shape, string } from "prop-types";
import { useCallback, useMemo } from "react";

import { Button, ButtonGroup, Menu } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import ActionsMenu from "../ActionsMenu";
import MergeAsOptions from "../MergeAsOptions";

import { useModifyTags } from "../../../../api/write";

import { makeSuggestionFor } from "../utils";

import * as customPropTypes from "../../../../propTypes";
import { CustomClasses } from "../../../../constants";

import "./index.css";


function AutoMerge({ library, suggestion }){
	const { recommend, use } = suggestion;
	const { mutate, status } = useModifyTags();

	const triggerMerge = useCallback(() => {
		mutate({
			into: recommend,
			library,
			tags: [...use.roam, ...use.zotero]
		});
	}, [library, mutate, recommend, use]);

	const buttonProps = useMemo(() => {
		if(status == "error"){
			return {
				disabled: true,
				icon: "warning",
				intent: "danger"
			};
		} else if(status == "success"){
			return {
				disabled: true,
				icon: "tick",
				intent: "success",
				text: "Merged"
			};
		} else {
			return {};
		}
	}, [status]);

	return <Button
		className={["zr-tag-suggestion--auto-merge", CustomClasses.TEXT_SMALL].join(" ")}
		icon="many-to-one"
		loading={status == "loading"}
		onClick={triggerMerge}
		text="Auto-merge"
		title={"Suggestion : " + recommend}
		{...buttonProps}
	/>;
}
AutoMerge.propTypes = {
	library: customPropTypes.zoteroLibraryType,
	suggestion: shape({
		recommend: oneOfType([string, oneOf([null])]),
		type: oneOf(["auto", "manual", null]),
		use: shape({
			roam: arrayOf(string),
			zotero: arrayOf(string)
		})
	})
};

function ManualMerge({ library, suggestion }){
	return <Popover2
		content={<Menu><MergeAsOptions library={library} options={suggestion.use} /></Menu>}
		interactionKind="click"
		popoverClassName={CustomClasses.POPOVER}
	>
		<Button className={["zr-tag-suggestion--merge-as", CustomClasses.TEXT_SMALL].join(" ")} rightIcon="caret-down" text="Merge as ..." />
	</Popover2>;
}
ManualMerge.propTypes = {
	library: customPropTypes.zoteroLibraryType,
	suggestion: shape({
		recommend: oneOfType([string, oneOf([null])]),
		type: oneOf(["auto", "manual", null]),
		use: shape({
			roam: arrayOf(string),
			zotero: arrayOf(string)
		})
	})
};

function Suggest({ entry, library }){
	const suggestion = makeSuggestionFor(entry);
	switch(suggestion.type){
	case "auto":
	case "manual":
		return <ButtonGroup minimal={true}>
			{suggestion.type == "auto" && <AutoMerge library={library} suggestion={suggestion} />}
			{suggestion.type == "manual" && <ManualMerge library={library} suggestion={suggestion} />}
			<Popover2
				content={<ActionsMenu library={library} mergeAs={suggestion.type == "auto"} suggestion={suggestion} />}
				interactionKind="click"
				placement="bottom-start"
				popoverClassName={CustomClasses.POPOVER}
			>
				<Button icon="more" />
			</Popover2>
		</ButtonGroup>;
	case null:
	default:
		return null;
	}
}
Suggest.propTypes = {
	entry: customPropTypes.taglistEntry,
	library: customPropTypes.zoteroLibraryType
};

export default Suggest;
