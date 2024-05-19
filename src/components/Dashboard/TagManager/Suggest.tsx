import { useCallback, useMemo } from "react";
import { Button, ButtonGroup, ButtonProps, IconName, Intent, Menu } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import ActionsMenu from "./ActionsMenu";
import MergeAsOptions from "./MergeAsOptions";

import { useModifyTags } from "@clients/zotero";
import { makeSuggestionFor } from "./utils";

import { CustomClasses } from "../../../constants";
import { ZLibrary, ZTagEntry, ZTagSuggestionAuto, ZTagSuggestionManual } from "Types/transforms";


type AutoMergeProps = {
	library: ZLibrary,
	suggestion: ZTagSuggestionAuto
};

function AutoMerge({ library, suggestion }: AutoMergeProps){
	const { recommend, use } = suggestion;
	const { mutate, status } = useModifyTags();

	const triggerMerge = useCallback(() => {
		mutate({
			into: recommend,
			library,
			tags: [...use.roam, ...use.zotero]
		});
	}, [library, mutate, recommend, use]);

	const buttonProps = useMemo<Partial<ButtonProps>>(() => {
		if(status == "error"){
			return {
				disabled: true,
				icon: "warning" as IconName,
				intent: Intent.DANGER
			};
		} else if(status == "success"){
			return {
				disabled: true,
				icon: "tick" as IconName,
				intent: Intent.SUCCESS,
				text: "Merged"
			};
		} else {
			return {
				icon: "many-to-one" as IconName
			};
		}
	}, [status]);

	return <Button
		active={true}
		className={["zr-tag-suggestion--auto-merge", CustomClasses.TEXT_SMALL].join(" ")}
		intent="primary"
		loading={status == "loading"}
		onClick={triggerMerge}
		text="Auto-merge"
		title={"Suggestion : " + recommend}
		{...buttonProps}
	/>;
}


type ManualMergeProps = {
	library: ZLibrary,
	suggestion: ZTagSuggestionManual
};

function ManualMerge({ library, suggestion }: ManualMergeProps){
	return <Popover2
		content={<Menu><MergeAsOptions library={library} options={suggestion.use} /></Menu>}
		interactionKind="click"
		popoverClassName={CustomClasses.POPOVER}
	>
		<Button className={["zr-tag-suggestion--merge-as", CustomClasses.TEXT_SMALL].join(" ")} intent="primary" rightIcon="caret-down" text="Merge as ..." />
	</Popover2>;
}


type SuggestProps = {
	entry: ZTagEntry,
	library: ZLibrary
};

function Suggest({ entry, library }: SuggestProps){
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


export default Suggest;
