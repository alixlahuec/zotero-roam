import { array, bool, func, object } from "prop-types";
import { memo, useCallback } from "react";

import { Checkbox, Spinner } from "@blueprintjs/core";

import { CustomClasses } from "../../constants";


const CollectionOption = memo(function CollectionOption(props) {
	const { collection, isChecked, onSelect } = props;
	const { data: { name }, depth, key } = collection;

	const handleCheckUncheck = useCallback(() => {
		onSelect(key);
	}, [key, onSelect]);

	return (
		<Checkbox
			checked={isChecked}
			className={[CustomClasses.TEXT_SMALL, `depth-${depth}`].join(" ")}
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

const CollectionsSelector = memo(function CollectionsSelector(props) {
	const { collections, onSelect, selectedCollections } = props;

	return (
		collections.length == 0
			? <Spinner size={12} title="Checking for collections in library" />
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
