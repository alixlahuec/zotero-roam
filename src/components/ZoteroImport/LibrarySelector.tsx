import { memo, useMemo } from "react";
import { RadioGroup, RadioGroupProps } from "@blueprintjs/core";

import { CustomClasses } from "../../constants";
import { ZLibrary } from "Types/transforms";


type OwnProps = {
	libraries: ZLibrary[],
	onSelect: RadioGroupProps["onChange"],
	selectedLib: ZLibrary
};

const LibrarySelector = memo<OwnProps>(function LibrarySelector({ libraries, selectedLib, onSelect }) {
	const options = useMemo<RadioGroupProps["options"]>(() => libraries.map(lib => ({ value: lib.path })), [libraries]);

	return (
		<RadioGroup 
			className={CustomClasses.TEXT_SMALL}
			inline={false}
			name="import-library"
			onChange={onSelect}
			options={options}
			selectedValue={selectedLib.path}/>
	);
});


export default LibrarySelector;
