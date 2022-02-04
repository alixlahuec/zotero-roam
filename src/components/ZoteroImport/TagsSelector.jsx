import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { MenuItem } from "@blueprintjs/core";
import { MultiSelect } from "@blueprintjs/select";

import { getAllPages } from "../../roam";
import { searchEngine } from "../../utils";

const createNewItemFromQuery = (tag) => tag;
const tagRenderer = (tag) => tag;

function createNewItemRenderer(query, active, handleClick){
	return <MenuItem active={active} icon="small-plus" onClick={handleClick} text={query} />;
}

function itemRenderer(item, itemProps) {
	let { handleClick, modifiers: { active } } = itemProps;
	return <MenuItem active={active} onClick={handleClick} text={item} />;
}

function itemListPredicate(query, items) {
	return items.filter(item => searchEngine(
		query, 
		item, {
			any_case: true,
			match: "partial",
			search_compounds: true,
			word_order: "loose"
		}))
		.sort((a,b) => a.length < b.length ? -1 : 1);
}

const TagsSelector = React.memo(function TagsSelector(props) {
	const { selectedTags, onRemove, onSelect } = props;
	const [roamPages,] = useState(() => getAllPages()); // https://tkdodo.eu/blog/things-to-know-about-use-state

	const addTag = useCallback((tag, _event) => {
		onSelect(tag);
	}, [onSelect]);

	const removeTag = useCallback((tag, _index) => {
		onRemove(tag);
	}, [onRemove]);

	const popoverProps = useMemo(() => {
		return {
			canEscapeKeyClose: false,
			fill: true,
			minimal: true,
			popoverClassName: "zr-popover"
		};
	}, []);

	const tagInputProps = useMemo(() => {
		return {
			leftIcon: "tag",
			tagProps: {
				minimal: true
			}
		};
	}, []);

	return (
		<MultiSelect
			createNewItemFromQuery={createNewItemFromQuery}
			createNewItemPosition="first"
			createNewItemRenderer={createNewItemRenderer}
			fill={true}
			initialContent={null}
			itemListPredicate={itemListPredicate}
			itemRenderer={itemRenderer}
			items={roamPages}
			onItemSelect={addTag}
			onRemove={removeTag}
			openOnKeyDown={true}
			placeholder="Add tags from Roam"
			popoverProps={popoverProps}
			resetOnQuery={true}
			resetOnSelect={true}
			selectedItems={selectedTags}
			tagInputProps={tagInputProps}
			tagRenderer={tagRenderer}
		/>
	);
});
TagsSelector.propTypes = {
	onRemove: PropTypes.func,
	onSelect: PropTypes.func,
	selectedTags: PropTypes.arrayOf(PropTypes.string)
};

export default TagsSelector;
