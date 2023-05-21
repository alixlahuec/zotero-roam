import { memo, useCallback } from "react";
import { ButtonGroup, Icon, IconName } from "@blueprintjs/core";

import { CustomClasses } from "../../../constants";

import "./index.css";


export type SortOption = {
	icon?: IconName | null,
	label: string,
	value: string
};

type SortButtonOwnProps = {
	isSelected: boolean,
	name: string,
	onClick: (value: SortOption["value"]) => void,
};

function SortButton(props: SortButtonOwnProps & SortOption){
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


type SortButtonsProps = {
	name: string,
	onSelect: (value: SortOption["value"]) => void,
	options: SortOption[],
	selectedOption: SortOption["value"]
};

const SortButtons = memo<SortButtonsProps>(function SortButtons(props){
	const { name, onSelect, options, selectedOption } = props;
	return (
		<ButtonGroup minimal={true} >
			{options.map(op => {
				return <SortButton key={op.value} isSelected={op.value == selectedOption} name={name} onClick={onSelect} {...op} />;
			})}
		</ButtonGroup>
	);
});

export default SortButtons;
