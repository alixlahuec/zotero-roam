import React, { useCallback } from "react";
import { array, bool, func, object } from "prop-types";
import { Checkbox, Spinner } from "@blueprintjs/core";

const CollectionOption = React.memo(function CollectionOption(props) {
	const { collection, isChecked, onSelect } = props;
	const { data: { name }, depth, key } = collection;

	const handleCheckUncheck = useCallback(() => {
		onSelect(key);
	}, [key, onSelect]);

	return (
		<Checkbox
			checked={isChecked}
			className={["zr-text-small", `depth-${depth}`].join(" ")}
			defaultChecked={false}
			inline={false}
			label={name}
			onChange={handleCheckUncheck}
		/>
	);
});
CollectionOption.propTypes = {
	collection: object,
	isChecked: bool,
	onSelect: func
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
	collections: array,
	onSelect: func,
	selectedCollections: array
};

export default CollectionsSelector;
