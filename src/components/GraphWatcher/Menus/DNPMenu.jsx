import React, { useMemo } from "react";
import { arrayOf, string } from "prop-types";
import { Button } from "@blueprintjs/core";

import RelatedPanel from "../RelatedPanel";
import { pluralize } from "../../../utils";
import useBool from "../../../hooks/useBool";

import * as customPropTypes from "../../../propTypes";

/* istanbul ignore next */
function DNPMenu({ added, date, title }){
	const [isDialogOpen, { on: openDialog, off: closeDialog }] = useBool(false);

	const hasAddedItems = added.length > 0;

	const buttonLabel = useMemo(() => {
		return pluralize(added.length, "item", " added");
	}, [added.length]);

	return (
		<>
			{hasAddedItems 
				? <>
					<Button minimal={true} icon="calendar" onClick={openDialog}>{buttonLabel}</Button>
					<RelatedPanel 
						isOpen={isDialogOpen}
						items={added}
						onClose={closeDialog}
						show={{ date, title, type: "added_on" }}
					/>
				</>
				: null}
		</>
	);
}
DNPMenu.propTypes = {
	added: arrayOf(customPropTypes.cleanRelatedItemType),
	date: string,
	title: string
};

export default DNPMenu;
