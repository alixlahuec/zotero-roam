import React, { useCallback, useMemo, useState } from "react";
import { arrayOf, string } from "prop-types";
import { Button } from "@blueprintjs/core";

import RelatedPanel from "../RelatedPanel";
import { pluralize } from "../../../utils";
import * as customPropTypes from "../../../propTypes";

function TagMenu(props){
	const { inAbstract = [], tag, tagged = [] } = props;
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [isShowing, setShowing] = useState(null);

	const hasTaggedItems = tagged.length > 0;
	const hasAbstracts = inAbstract.length > 0;

	const defaultShowProps = useMemo(() => {
		return {
			title: tag,
			type: hasTaggedItems ? "with_tag" : "with_abstract"
		};
	}, [hasTaggedItems, tag]);

	const showAbstracts = useCallback(() => {
		setDialogOpen(true);
		setShowing({
			title: tag,
			type: "with_abstract"
		});
	}, [tag]);

	const showTagged = useCallback(() => {
		setDialogOpen(true);
		setShowing({
			title: tag,
			type: "with_tag"
		});
	}, [tag]);

	const closeDialog = useCallback(() => {
		setDialogOpen(false);
	}, []);

	const abstractsLabel = useMemo(() => {
		return pluralize(inAbstract.length, "abstract");
	}, [inAbstract.length]);

	const taggedLabel = useMemo(() => {
		return pluralize(tagged.length, "tagged item");
	}, [tagged.length]);

	return (
		<>
			{hasTaggedItems
				? <Button minimal={true} icon="manual" onClick={showTagged}>{taggedLabel}</Button>
				: null}
			{hasAbstracts
				? <Button minimal={true} icon="manually-entered-data" onClick={showAbstracts}>{abstractsLabel}</Button>
				: null}
			{hasTaggedItems || hasAbstracts
				? <RelatedPanel
					isOpen={isDialogOpen}
					items={(isShowing || defaultShowProps).type == "with_tag" ? tagged : inAbstract} 
					onClose={closeDialog}
					show={isShowing || defaultShowProps} />
				: null}
		</>
	);
}
TagMenu.propTypes = {
	inAbstract: arrayOf(customPropTypes.cleanRelatedItemType),
	tag: string,
	tagged: arrayOf(customPropTypes.cleanRelatedItemType)
};

export default TagMenu;
