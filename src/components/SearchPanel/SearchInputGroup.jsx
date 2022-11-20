import { bool, func, object, shape } from "prop-types";
import { memo, useMemo } from "react";

import { Button, Classes, Icon, InputGroup, Switch, useHotkeys } from "@blueprintjs/core";

import { validateShortcuts } from "../../setup";
import { useShortcutsSettings } from "Components/UserSettings/Shortcuts";

import { dialogLabel } from "./classes";

import { CustomClasses } from "../../constants";


const SearchInputGroup = memo(function SearchInputGroup(props) {
	const { handleClose, 
		handleKeyDown, handleKeyUp, handleQueryChange, 
		quickCopyProps: { isActive: isQCActive, toggle: toggleQC }, 
		searchbar } = props;
	const [shortcuts] = useShortcutsSettings();
	// Only pass valid hotkey combos
	const sanitizedShortcuts = useMemo(() => validateShortcuts(shortcuts), [shortcuts]);

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
				<Switch className={["zr-quick-copy", CustomClasses.TEXT_AUXILIARY].join(" ")} label="Quick Copy" checked={isQCActive} onChange={toggleQC} role="switch" aria-checked={isQCActive} />
				<Button className={Classes.MINIMAL} large={true} icon="cross" onClick={handleClose} title="Close searchbar" />
			</>
		);
	}, [handleClose, isQCActive, toggleQC]);

	const hotkeys = useMemo(() => {
		const defaultProps = {
			allowInInput: true,
			global: true,
			preventDefault: true,
			stopPropagation: true
		};

		const configs = {
			"focusSearchBar": {
				label: "Focus the searchbar",
				onKeyDown: () => searchbar.current.focus()
			},
			"toggleQuickCopy": {
				label: "Toggle QuickCopy",
				onKeyDown: () => toggleQC()
			}
		};

		return Object.keys(configs)
			.map(cmd => {
				const combo = sanitizedShortcuts[cmd] || "";
				if(combo !== ""){
					return {
						...defaultProps,
						...configs[cmd],
						combo: sanitizedShortcuts[cmd]
					};
				} else {
					return false;
				}
			}).filter(Boolean);
		
	}, [searchbar, sanitizedShortcuts, toggleQC]);

	useHotkeys(hotkeys, { showDialogKeyCombo: "shift+Z+R" });

	return (
		<InputGroup
			className={[Classes.INPUT, Classes.FILL, "zr-library-search-input-group"].join(" ")}
			id="zotero-roam-search-autocomplete"
			placeholder="Search in abstract, title, authors (last names), year, tags, or citekey"
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
