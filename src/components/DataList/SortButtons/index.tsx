import { useCallback } from "react";
import { ButtonGroup, Icon, IconName } from "@blueprintjs/core";

import { CustomClasses } from "../../../constants";
import "./_index.sass";


export type SortOption<T extends string | number> = {
	icon?: IconName | null,
	label: string,
	value: T
};

type SortButtonOwnProps<T extends string | number> = {
	isSelected: boolean,
	name: string,
	onClick: (value: T) => void,
};

function SortButton<T extends string | number>(props: SortButtonOwnProps<T> & SortOption<T>){
	const { icon = null, isSelected, label, name, onClick, value } = props;
	const uniqueId = [name, value].join("_");

	const handleClick = useCallback(() => onClick(value), [onClick, value]);

	return (
		<span className="zr-sort-option" onClick={handleClick} >
			<input type="radio" checked={isSelected} disabled={isSelected} id={uniqueId} name={name} onChange={() => {}} value={value} />
			<Icon icon={icon} />
			<label className={CustomClasses.TEXT_SMALL} htmlFor={uniqueId}>{label}</label>
		</span>
	);
}


type SortButtonsProps<T extends string | number> = {
	name: string,
	onSelect: (value: SortOption<T>["value"]) => void,
	options: SortOption<T>[],
	selectedOption: SortOption<T>["value"]
};

function SortButtons<T extends string | number>(props: SortButtonsProps<T>){
	const { name, onSelect, options, selectedOption } = props;
	return (
		<ButtonGroup minimal={true} >
			{options.map(op => {
				return <SortButton<T> key={op.value} isSelected={op.value == selectedOption} name={name} onClick={onSelect} {...op} />;
			})}
		</ButtonGroup>
	);
}

export default SortButtons;
