import { bool, func, oneOf } from "prop-types";
import { memo, useCallback, useMemo } from "react";

import DialogOverlay from "Components/DialogOverlay";
import ErrorBoundary from "Components/Errors/ErrorBoundary";
import LibraryQueryList from "./LibraryQueryList";

import useBool from "../../hooks/useBool";
import { useCopySettings } from "Components/UserSettings/Copy";
import { useQuery_Items } from "../../api/queries";
import { useRequestsSettings } from "Components/UserSettings/Requests";
import { useRoamCitekeys } from "Components/RoamCitekeysContext";

import { cleanLibrary } from "./helpers";

import { dialogClass, dialogLabel } from "./classes";

import "./index.css";


function useGetItems(reqs, roamCitekeys, opts = {}){
	const select = useCallback((datastore) => {
		return datastore.data
			? cleanLibrary(datastore.data, roamCitekeys)
			: [];
	}, [roamCitekeys]);

	const itemQueries = useQuery_Items(reqs, {
		...opts,
		notifyOnChangeProps: ["data"],
		select
	});

	const itemData = useMemo(() => itemQueries.map(q => q.data || []).flat(1), [itemQueries]);

	return itemData;
}

const SearchPanel = memo(function SearchPanel({ isOpen, onClose, status }) {
	const [{ useQuickCopy }] = useCopySettings();
	const [{ dataRequests }] = useRequestsSettings();
	const [roamCitekeys,] = useRoamCitekeys();

	const [quickCopyActive, { toggle: toggleQuickCopy }] = useBool(useQuickCopy); // Is QuickCopy active by default ?

	const items = useGetItems(dataRequests, roamCitekeys, { enabled: status == "on" });

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
SearchPanel.propTypes = {
	isOpen: bool,
	onClose: func,
	status: oneOf(["on", "off", "disabled"])
};

export default SearchPanel;
