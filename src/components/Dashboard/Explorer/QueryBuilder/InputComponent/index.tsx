import { useCallback, useMemo } from "react";

import { InputDateRange, InputDateSingle, InputMultiSelect, InputMultiSelectProps, InputText, TagsSelector } from "Components/Inputs";
import { useTypemapSettings } from "Components/UserSettings";
import { InputEnum, InputValuesMap } from "../types";


type ItemTypeProps = Omit<InputMultiSelectProps, "options">;

function ItemType({ value, setValue }: ItemTypeProps){
	const [typemap] = useTypemapSettings();
	const typeOptions = useMemo(() => Object.keys(typemap).map(k => ({ value: k, label: typemap[k] })), [typemap]);

	return <InputMultiSelect options={typeOptions} value={value} setValue={setValue} />;
}


type ItemTagsProps = {
	setValue: (value: string[]) => void,
	value: string[]
};

function ItemTags({ value, setValue }: ItemTagsProps){
	const onSelect = useCallback((tag) => setValue([...value, tag]), [setValue, value]);
	const onRemove = useCallback((tag) => setValue(value.filter(val => val != tag)), [setValue, value]);

	return <TagsSelector onRemove={onRemove} onSelect={onSelect} selectedTags={value} />;
}


type InputComponentProps<T extends InputEnum | null> = {
	setValue: T extends InputEnum ? ((value: InputValuesMap[T]) => void) : () => void,
	value: T extends InputEnum ? InputValuesMap[T] : null
};

function InputComponent<T extends InputEnum | null>({ inputType, ...props }: { inputType: T } & InputComponentProps<T>){
	switch (inputType) {
	case InputEnum.ITEM_TYPE:
		return <ItemType {...props as InputComponentProps<InputEnum.ITEM_TYPE>} />;
	case InputEnum.ITEM_TAGS:
		return <ItemTags {...props as InputComponentProps<InputEnum.ITEM_TAGS>} />;
	case InputEnum.DATE:
		return <InputDateSingle {...props as InputComponentProps<InputEnum.DATE>} />;
	case InputEnum.DATE_RANGE:
		return <InputDateRange {...props as InputComponentProps<InputEnum.DATE_RANGE>} />;
	case InputEnum.TEXT:
		return <InputText {...props as InputComponentProps<InputEnum.TEXT>} />;
	case null:
	default:
		return null;
	}
}


export default InputComponent;