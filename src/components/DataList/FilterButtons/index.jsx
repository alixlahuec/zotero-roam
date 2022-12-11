import { arrayOf, bool, func, shape, string } from "prop-types";
import { Button, ButtonGroup } from "@blueprintjs/core";


function FilterButtons({ options, toggleFilter }){
	return <ButtonGroup minimal={true}>
		{options.map(op => (
			<Button key={op.value}
				active={op.active}
				className="zr-filter-btn"
				icon={op.active ? "small-tick" : "blank"}
				intent="primary"
				minimal={true}
				onClick={() => toggleFilter(op.value)}
				text={op.label}
				{...op} />
		))}
	</ButtonGroup>;
}
FilterButtons.propTypes = {
	options: arrayOf(shape({
		active: bool,
		label: string,
		value: string
	})),
	toggleFilter: func
};

export default FilterButtons;