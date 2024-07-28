import { useCallback, useMemo, useState } from "react";
import { Button } from "@blueprintjs/core";

import { useBool } from "@hooks";

import RelatedPanel from "../RelatedPanel";
import { ShowPropertiesRelated, ShowTypeRelated } from "../types";

import { pluralize } from "../../../utils";
import { SCleanRelatedItem } from "Types/transforms";


export type TagMenuProps = {
	inAbstract: SCleanRelatedItem[],
	tag: string,
	tagged: SCleanRelatedItem[]
};


function TagMenu(props: TagMenuProps){
	const { inAbstract = [], tag, tagged = [] } = props;
	const [isDialogOpen, { on: openDialog, off: closeDialog }] = useBool(false);
	const [isShowing, setShowing] = useState<ShowPropertiesRelated>();

	const hasTaggedItems = tagged.length > 0;
	const hasAbstracts = inAbstract.length > 0;

	const fallbackShowProps = useMemo<ShowPropertiesRelated>(() => ({
		title: tag,
		type: tagged.length > 0
			? ShowTypeRelated.WITH_TAG
			: ShowTypeRelated.WITH_ABSTRACT
	}), [tag, tagged.length]);

	const showAbstracts = useCallback(() => {
		openDialog();
		setShowing({
			title: tag,
			type: ShowTypeRelated.WITH_ABSTRACT
		});
	}, [tag, openDialog]);

	const showTagged = useCallback(() => {
		openDialog();
		setShowing({
			title: tag,
			type: ShowTypeRelated.WITH_TAG
		});
	}, [tag, openDialog]);

	const abstractsLabel = useMemo(() => {
		return pluralize(inAbstract.length, "abstract");
	}, [inAbstract.length]);

	const taggedLabel = useMemo(() => {
		return pluralize(tagged.length, "tagged item");
	}, [tagged.length]);

	return (
		<>
			{hasTaggedItems &&
				<Button minimal={true} icon="manual" onClick={showTagged}>{taggedLabel}</Button>}
			{hasAbstracts &&
				<Button minimal={true} icon="manually-entered-data" onClick={showAbstracts}>{abstractsLabel}</Button>}
			{(hasTaggedItems || hasAbstracts) &&
				<RelatedPanel
					isOpen={isDialogOpen}
					items={(isShowing || fallbackShowProps).type == ShowTypeRelated.WITH_TAG ? tagged : inAbstract} 
					onClose={closeDialog}
					show={isShowing || fallbackShowProps} />}
		</>
	);
}


export default TagMenu;
