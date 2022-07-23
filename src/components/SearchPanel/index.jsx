import React, { useContext } from "react";
import { bool, func, oneOf} from "prop-types";

import { ExtensionContext, UserSettings } from "../App";
import DialogOverlay from "../DialogOverlay";
import LibraryQueryList from "./LibraryQueryList";
import { useRoamCitekeys } from "../RoamCitekeysContext";

import { useQuery_Items } from "../../api/queries";
import { cleanLibrary } from "../../utils";

import SentryBoundary from "../Errors/SentryBoundary";
import useBool from "../../hooks/useBool";
import { dialogClass, dialogLabel } from "./classes";
import "./index.css";

function useGetItems(reqs, roamCitekeys, opts = {}){
	const itemQueries = useQuery_Items(reqs, {
		...opts,
		notifyOnChangeProps: ["data"],
		select: (datastore) => {
			return datastore.data
				? cleanLibrary(datastore.data, roamCitekeys)
				: [];
		}
	});

	return itemQueries.map(q => q.data || []).flat(1);
}

const SearchPanel = React.memo(function SearchPanel(props) {
	const { isOpen, onClose, status } = props;
	const { dataRequests } = useContext(ExtensionContext);
	const [roamCitekeys,] = useRoamCitekeys();
	const { copy: { useQuickCopy} } = useContext(UserSettings);

	const [quickCopyActive, { toggle: toggleQuickCopy }] = useBool(useQuickCopy); // Is QuickCopy active by default ?

	const items = useGetItems(dataRequests, roamCitekeys, { enabled: status == "on" });

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
					quickCopyProps={{ isActive: quickCopyActive, toggle: toggleQuickCopy}} />
			</SentryBoundary>
		</DialogOverlay>
	);

});
SearchPanel.propTypes = {
	isOpen: bool,
	onClose: func,
	status: oneOf(["on", "off", "disabled"])
};

export default SearchPanel;
