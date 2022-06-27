import React, { useCallback, useMemo, useState } from "react";
import { arrayOf, string } from "prop-types";
import { Button } from "@blueprintjs/core";

import RelatedPanel from "../RelatedPanel";
import { pluralize } from "../../../utils";
import * as customPropTypes from "../../../propTypes";

function DNPMenu({ added, date, title }){
	const [isDialogOpen, setDialogOpen] = useState(false);

	const hasAddedItems = added.length > 0;

	const openDialog = useCallback(() => {
		setDialogOpen(true);
	}, []);
    
	const closeDialog = useCallback(() => {
		setDialogOpen(false);
	}, []);

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
