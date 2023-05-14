import { memo, useCallback } from "react";
import { Checkbox, Spinner } from "@blueprintjs/core";

import { CustomClasses } from "../../constants";
import { ZEnrichedCollection } from "Types/transforms";


type OptionProps = {
	collection: ZEnrichedCollection,
	isChecked: boolean,
	onSelect: (value: string) => void
};

const CollectionOption = memo<OptionProps>(function CollectionOption(props) {
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


type SelectorProps = {
	collections: ZEnrichedCollection[],
	onSelect: (value: string) => void,
	selectedCollections: string[]
};

const CollectionsSelector = memo<SelectorProps>(function CollectionsSelector(props) {
	const { collections, onSelect, selectedCollections } = props;

	return (
		collections.length == 0
			? <Spinner size={12} />
			: <div className="options-collections-list">
				{collections.map(coll => <CollectionOption key={coll.key} collection={coll} isChecked={selectedCollections.includes(coll.key)} onSelect={onSelect} />)}
			</div>
	);
});


export default CollectionsSelector;
