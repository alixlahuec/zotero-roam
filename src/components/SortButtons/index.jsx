import { arrayOf, bool, func, shape, string } from "prop-types";
import { memo, useCallback } from "react";

import { ButtonGroup, Icon } from "@blueprintjs/core";

import { CustomClasses } from "../../constants";

import "./index.css";


function SortButton(props){
	const { icon, isSelected, label, name, onClick, value } = props;
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
SortButton.propTypes = {
	icon: string,
	isSelected: bool,
	label: string,
	name: string,
	onClick: func,
	value: string
};

const SortButtons = memo(function SortButtons(props){
	const { name, onSelect, options, selectedOption } = props;
	return (
		<ButtonGroup minimal={true} >
			{options.map(op => {
				return <SortButton key={op.value} isSelected={op.value == selectedOption} name={name} onClick={onSelect} {...op} />;
			})}
		</ButtonGroup>
	);
});
SortButtons.propTypes = {
	name: string,
	onSelect: func,
	options: arrayOf(shape({
		icon: string,
		label: string,
		value: string
	})),
	selectedOption: string
};

export default SortButtons;
