import React, { useCallback } from "react";
import { arrayOf, bool, func, shape, string } from "prop-types";
import { ButtonGroup, Icon } from "@blueprintjs/core";

import "./index.css";

function SortButton(props){
	const { icon, isSelected, label, name, onClick, value } = props;
	const uniqueId = [name, value].join("_");

	const handleClick = useCallback(() => onClick(value), [onClick, value]);

	return (
		<span className="zr-sort-option" onClick={handleClick} >
			<input type="radio" checked={isSelected ? "true" : null} disabled={isSelected} id={uniqueId} name={name} value={value} />
			<Icon icon={icon} />
			<label className="zr-text-small" htmlFor={uniqueId}>{label}</label>
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

const SortButtons = React.memo(function SortButtons(props){
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
