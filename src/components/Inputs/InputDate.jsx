import React from "react";
import { arrayOf, func, instanceOf } from "prop-types";
import { Icon } from "@blueprintjs/core";
import { DateInput, DateRangeInput } from "@blueprintjs/datetime";

import { makeDNP } from "../../utils";

const popoverProps = {
	canEscapeKeyClose: false,
	fill: true,
	minimal: true,
	placement: "bottom",
	popoverClassName: "zr-popover zr-date-picker"
};

const dateProps = {
	formatDate: (date/*, locale */) => makeDNP(date, { brackets: false }),
	parseDate: (str) => new Date(str)
};

function InputDateSingle({ value, setValue }){
	return <DateInput
		{...dateProps}
		closeOnSelection={true}
		highlightCurrentDay={true}
		onChange={setValue}
		placeholder="Date"
		popoverProps={popoverProps}
		rightElement={<Icon icon="timeline-events" />}
		shortcuts={false}
		value={value}
	/>;
}
InputDateSingle.propTypes = {
	value: instanceOf(Date),
	setValue: func
};

function InputDateRange({ value, setValue }){
	return <DateRangeInput
		{...dateProps}
		closeOnSelection={true}
		highlightCurrentDay={true}
		onChange={setValue}
		popoverProps={popoverProps}
		shortcuts={false}
		value={value}
	/>;
}
InputDateRange.propTypes = {
	value: arrayOf(instanceOf(Date)),
	setValue: func
};

export {
	InputDateSingle,
	InputDateRange
};
