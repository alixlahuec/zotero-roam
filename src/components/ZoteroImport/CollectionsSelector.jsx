import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { Checkbox, Spinner } from "@blueprintjs/core";

const CollectionOption = React.memo(function CollectionOption(props) {
	const { collection, isChecked, onSelect } = props;
	const { data: { name }, depth, key } = collection;

	const handleCheckUncheck = useCallback(() => {
		onSelect(key);
	}, [key, onSelect]);

	return (
		<Checkbox key={key}
			checked={isChecked}
			data-option-depth={depth}
			defaultChecked={false}
			inline={false}
			label={name}
			onChange={handleCheckUncheck}
		/>
	);
});
CollectionOption.propTypes = {
	collection: PropTypes.object,
	isChecked: PropTypes.bool,
	onSelect: PropTypes.func
};

const CollectionsSelector = React.memo(function CollectionsSelector(props) {
	const { collections, onSelect, selectedCollections } = props;

	return (
		collections.length == 0
			? <Spinner />
			: <div className="options-collections-list">
				{collections.map(coll => <CollectionOption key={coll.key} collection={coll} isChecked={selectedCollections.includes(coll.key)} onSelect={onSelect} />)}
			</div>
	);
});
CollectionsSelector.propTypes = {
	collections: PropTypes.array,
	onSelect: PropTypes.func,
	selectedCollections: PropTypes.array
};

export default CollectionsSelector;
