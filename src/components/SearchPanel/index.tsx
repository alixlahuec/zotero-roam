import { memo, useCallback, useMemo } from "react";

import DialogOverlay, { DialogOverlayProps } from "Components/DialogOverlay";
import { ErrorBoundary } from "Components/Errors";
import { useRoamCitekeys } from "Components/RoamCitekeysContext";
import { useCopySettings, useRequestsSettings } from "Components/UserSettings";
import LibraryQueryList from "./LibraryQueryList";

import { useItems } from "@clients/zotero";
import { useBool } from "@hooks";
import { Queries } from "@services/react-query";

import { dialogClass, dialogLabel } from "./classes";
import { cleanLibrary } from "./helpers";

import { RCitekeyPages } from "Types/transforms";
import { DataRequest, ExtensionStatusEnum } from "Types/extension";


function useGetItems(reqs: DataRequest[], roamCitekeys: RCitekeyPages, opts = {}){
	const select = useCallback((datastore: Queries.Data.Items) => {
		return datastore.data
			? cleanLibrary(datastore.data, roamCitekeys)
			: [];
	}, [roamCitekeys]);

	const itemQueries = useItems(reqs, {
		...opts,
		notifyOnChangeProps: ["data"],
		select
	});

	const itemData = useMemo(() => itemQueries.map(q => q.data || []).flat(1), [itemQueries]);

	return itemData;
}


type SearchPanelProps = {
	status: ExtensionStatusEnum
} & Pick<DialogOverlayProps, "isOpen" | "onClose">;

const SearchPanel = memo<SearchPanelProps>(function SearchPanel({ isOpen, onClose, status }) {
	const [{ useQuickCopy }] = useCopySettings();
	const [{ dataRequests }] = useRequestsSettings();
	const [roamCitekeys/*, updateCitekeys */] = useRoamCitekeys();

	const [quickCopyActive, { toggle: toggleQuickCopy }] = useBool(useQuickCopy); // Is QuickCopy active by default ?

	const items = useGetItems(dataRequests, roamCitekeys, { enabled: status == ExtensionStatusEnum.ON });

	return (
		<DialogOverlay
			ariaLabelledBy={dialogLabel}
			className={dialogClass}
			isOpen={isOpen}
			lazy={false}
			onClose={onClose} >
			<ErrorBoundary>
				<LibraryQueryList 
					handleClose={onClose}
					isOpen={isOpen}
					items={items}
					quickCopyProps={{ isActive: quickCopyActive, toggle: toggleQuickCopy }} />
			</ErrorBoundary>
		</DialogOverlay>
	);

});


export default SearchPanel;
