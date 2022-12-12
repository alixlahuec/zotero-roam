import { arrayOf, bool, func, shape, string } from "prop-types";
import { Button, ButtonGroup } from "@blueprintjs/core";

import { CustomClasses } from "../../../constants";


function FilterButtons({ options, toggleFilter }){
	return <ButtonGroup minimal={true}>
		{options.map(op => (
			<Button key={op.value}
				active={op.active}
				className={["zr-filter-btn", CustomClasses.TEXT_SMALL, CustomClasses.TEXT_SECONDARY].join(" ")}
				minimal={true}
				onClick={() => toggleFilter(op.value)}
				rightIcon={op.active ? "small-cross" : "small-plus"}
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