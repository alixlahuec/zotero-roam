import React, { useContext, useMemo } from "react";
import { bool, func, object, shape } from "prop-types";
import { Button, Classes, Icon, InputGroup, Switch, useHotkeys } from "@blueprintjs/core";

import { UserSettings } from "../App";
import { dialogLabel } from "./classes";

const SearchInputGroup = React.memo(function SearchInputGroup(props) {
	const { handleClose, 
		handleKeyDown, handleKeyUp, handleQueryChange, 
		quickCopyProps: { isActive: isQCActive, toggle: toggleQC }, 
		searchbar } = props;
	const { shortcuts: shortcutsSettings } = useContext(UserSettings);

	const searchbarLeftElement = useMemo(() => 
		<Icon id={dialogLabel} 
			title="Search in Zotero items"
			htmlTitle="Search in Zotero items"
			intent="primary"
			icon="learning" />
	, []);

	const searchbarRightElement = useMemo(() => {
		return (
			<>
				<Switch className={["zr-quick-copy", "zr-auxiliary"].join(" ")} label="Quick Copy" checked={isQCActive} onChange={toggleQC} />
				<Button className={Classes.MINIMAL} large={true} icon="cross" onClick={handleClose} />
			</>
		);
	}, [handleClose, isQCActive, toggleQC]);

	const hotkeys = useMemo(() => {
		let defaultProps = {
			allowInInput: true,
			global: true,
			preventDefault: true,
			stopPropagation: true
		};

		let configs = {
			"toggleQuickCopy": {
				label: "Toggle QuickCopy",
				onKeyDown: () => toggleQC()
			}
		};

		return Object.keys(shortcutsSettings)
			.filter(k => Object.keys(configs).includes(k) && shortcutsSettings[k] != false)
			.map(k => {
				return {
					...defaultProps,
					...configs[k],
					combo: shortcutsSettings[k]
				};
			});
		
	}, [toggleQC, shortcutsSettings]);

	useHotkeys(hotkeys, {showDialogKeyCombo: "shift+Z+R"});

	return (
		<InputGroup
			className={[Classes.INPUT, Classes.FILL].join(" ")}
			id="zotero-roam-search-autocomplete"
			placeholder="Search by title, authors (last names), year, tags, or citekey"
			spellCheck="false"
			autoComplete="off"
			type="text"
			large={true}
			onChange={handleQueryChange}
			onKeyDown={handleKeyDown}
			onKeyUp={handleKeyUp}
			inputRef={searchbar}
			leftElement={searchbarLeftElement}
			rightElement={searchbarRightElement}
		/>
	)	;
});
SearchInputGroup.propTypes = {
	handleClose: func,
	handleKeyDown: func,
	handleKeyUp: func,
	handleQueryChange: func,
	quickCopyProps: shape({
		isActive: bool,
		toggle: func
	}),
	searchbar: object
};

export default SearchInputGroup;
