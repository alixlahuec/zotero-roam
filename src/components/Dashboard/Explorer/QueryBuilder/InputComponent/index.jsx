import { any, array, func, oneOf, string } from "prop-types";
import { useCallback, useMemo } from "react";

import { InputDateRange, InputDateSingle } from "Components/Inputs/InputDate";
import InputMultiSelect from "Components/Inputs/InputMultiSelect";
import InputText from "Components/Inputs/InputText";
import TagsSelector from "Components/Inputs/TagsSelector";

import { useTypemapSettings } from "Components/UserSettings/Typemap";

import { queries, types } from "../queries";


function ItemType({ inputType, value, setValue }){
	const [typemap] = useTypemapSettings();

	const typeOptions = useMemo(() => {
		return Object.keys(typemap)
			.map(k => ({ value: k, label: typemap[k] }));
	}, [typemap]);

	if(inputType == "multiselect"){
		return <InputMultiSelect options={typeOptions} value={value} setValue={setValue} />;
	}
}
ItemType.propTypes = {
	inputType: oneOf(types),
	setValue: func,
	value: array
};

function ItemTags({ value, setValue }){
	const onSelect = useCallback((tag) => setValue([...value, tag]), [setValue, value]);
	const onRemove = useCallback((tag) => setValue(value.filter(val => val != tag)), [setValue, value]);

	return <TagsSelector onRemove={onRemove} onSelect={onSelect} selectedTags={value} />;
}
ItemTags.propTypes = {
	value: array,
	setValue: func
};

function InputComponent({ property, relationship, value, setValue }){
	const { inputType } = queries[property][relationship];

	if(inputType == null){
		return null;
	} else if(property == "Item type"){
		return <ItemType inputType={inputType} value={value} setValue={setValue} />;
	} else if(property == "Tags"){
		return <ItemTags value={value} setValue={setValue} />;
	} else if(inputType == "date"){
		return <InputDateSingle value={value} setValue={setValue} />;
	} else if(inputType == "date-range"){
		return <InputDateRange value={value} setValue={setValue} />;
	} else if(inputType == "text"){
		return <InputText value={value} setValue={setValue} />;
	}
}
InputComponent.propTypes = {
	property: oneOf(Object.keys(queries)),
	relationship: string,
	value: any,
	setValue: func
};

export default InputComponent;