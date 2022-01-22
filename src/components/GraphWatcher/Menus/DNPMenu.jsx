import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@blueprintjs/core";

import AuxiliaryDialog from "../AuxiliaryDialog";
import { pluralize } from "../../../utils";
import * as customPropTypes from "../../../propTypes";

function DNPMenu(props){
	const { added, date, metadataSettings, portalId, title } = props;
	const [isDialogOpen, setDialogOpen] = useState(false);

	const hasAddedItems = added.length > 0;

	const isShowing = useMemo(() => {
		return {
			date,
			title,
			type: "added_on"
		};
	}, [date, title]);

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
					<AuxiliaryDialog className="added-on" 
						isOpen={isDialogOpen}
						items={added} 
						metadataSettings={metadataSettings}
						portalId={portalId}
						show={isShowing} 
						onClose={closeDialog}
					/>
				</>
				: null}
		</>
	);
}
DNPMenu.propTypes = {
	added: PropTypes.arrayOf(customPropTypes.cleanRelatedItemType),
	date: PropTypes.date,
	metadataSettings: PropTypes.object,
	portalId: PropTypes.string,
	title: PropTypes.string,
};

export default DNPMenu;
