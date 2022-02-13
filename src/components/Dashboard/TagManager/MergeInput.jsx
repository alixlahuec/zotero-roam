import React, { useCallback, useMemo, useState} from "react";
import { arrayOf, bool, string } from "prop-types";
import { Button, InputGroup } from "@blueprintjs/core";

import { useModifyTags } from "../../../api/write";

import * as customPropTypes from "../../../propTypes";

function MergeInput(props){
	const { defaultValue, disabled, library, selectedTags } = props;
	const [value, setValue] = useState(defaultValue);
	const { mutate, status } = useModifyTags();

	const handleChange = useCallback((event) => {
		let val = event.target?.value;
		setValue(val);
	}, []);

	const triggerMerge = useCallback(() => {
		mutate({
			into: value,
			library,
			tags: selectedTags
		}, {
			onSettled: (data, error, variables) => console.log(data, error, variables)
		});
	}, [library, mutate, selectedTags, value]);

	const mergeButton = useMemo(() => {
		const sharedProps = {
			active: true,
			className: "zr-text-small",
			disabled: disabled || selectedTags.length == 0 || value.length == 0 || status == "success",
			loading: status == "loading",
			minimal: true,
			onClick: triggerMerge
		};

		return <Button 
			{...sharedProps}
			icon={status == "success" ? "small-tick" : "arrow-right"}
			intent={status == "success" ? "success" : "primary"}
			text={status == "success" ? "Done" : "Merge"} />;
	}, [disabled, status, selectedTags.length, triggerMerge, value]);

	return (
		<InputGroup 
			disabled={disabled || selectedTags.length == 0 || ["loading", "success"].includes(status)}
			onChange={handleChange}
			rightElement={mergeButton}
			small={true}
			value={value} />
	);
}
MergeInput.propTypes = {
	defaultValue: string,
	disabled: bool,
	library: customPropTypes.zoteroLibraryType,
	selectedTags: arrayOf(string)
};

export default MergeInput;
