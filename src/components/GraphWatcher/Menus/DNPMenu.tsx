import { useMemo } from "react";
import { Button } from "@blueprintjs/core";

import { useBool } from "@hooks";

import RelatedPanel from "../RelatedPanel";
import { ShowTypeRelated } from "../types";

import { pluralize } from "../../../utils";

import { SCleanRelatedItem } from "Types/transforms";


type DNPMenuProps = {
	added: SCleanRelatedItem[],
	title: string
};


function DNPMenu({ added, title }: DNPMenuProps){
	const [isDialogOpen, { on: openDialog, off: closeDialog }] = useBool(false);

	const hasAddedItems = added.length > 0;

	const buttonLabel = useMemo(() => {
		return pluralize(added.length, "item", " added");
	}, [added.length]);

	return <>
		{hasAddedItems 
			? <>
				<Button minimal={true} icon="calendar" onClick={openDialog}>{buttonLabel}</Button>
				<RelatedPanel 
					isOpen={isDialogOpen}
					items={added}
					onClose={closeDialog}
					show={{ title, type: ShowTypeRelated.ADDED_ON }}
				/>
			</>
			: null}
	</>;
}


export default DNPMenu;
