import React, { useCallback, useContext, useMemo, useState } from "react";
import { bool, func, oneOf} from "prop-types";

import { ExtensionContext, UserSettings } from "../App";
import DialogOverlay from "../DialogOverlay";
import LibraryQueryList from "./LibraryQueryList";
import { useRoamCitekeys } from "../RoamCitekeysContext";

import { useQuery_Items } from "../../api/queries";
import { cleanLibrary } from "../../utils";

import SentryBoundary from "../Errors/SentryBoundary";
import { dialogClass, dialogLabel } from "./classes";
import "./index.css";

function useGetItems(reqs, roamCitekeys, opts = {}){
	const itemQueries = useQuery_Items(reqs, {
		...opts,
		notifyOnChangeProps: ["data"],
		select: (datastore) => {
			if(datastore.data){
				return cleanLibrary(datastore.data, roamCitekeys);
			} else {
				return [];
			}
		}
	});

	return itemQueries.map(q => q.data || []).flat(1);
}

const SearchPanel = React.memo(function SearchPanel(props) {
	const { isOpen, onClose, status } = props;
	const { dataRequests } = useContext(ExtensionContext);
	const [roamCitekeys,] = useRoamCitekeys();
	const { copy: { useQuickCopy} } = useContext(UserSettings);

	let [quickCopyActive, setQuickCopy] = useState(useQuickCopy); // Is QuickCopy active by default ?

	const items = useGetItems(dataRequests, roamCitekeys, { enabled: status == "on" });

	const toggleQuickCopy = useCallback(() => { setQuickCopy(prev => !prev); }, []);

	const quickCopyProps = useMemo(() => ({
		isActive: quickCopyActive,
		toggle: toggleQuickCopy
	}), [quickCopyActive, toggleQuickCopy]);

	return (
		<DialogOverlay
			ariaLabelledBy={dialogLabel}
			className={dialogClass}
			isOpen={isOpen}
			lazy={false}
			onClose={onClose} >
			<SentryBoundary feature="dialog-search">
				<LibraryQueryList 
					handleClose={onClose}
					isOpen={isOpen}
					items={items}
					quickCopyProps={quickCopyProps} />
			</SentryBoundary>
		</DialogOverlay>
	);

});
SearchPanel.propTypes = {
	isOpen: bool,
	onClose: func,
	status: oneOf(["on", "off"])
};

export default SearchPanel;
