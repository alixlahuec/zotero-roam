import { arrayOf, func, instanceOf } from "prop-types";
import React from "react";

import { DateInput, DateRangeInput } from "@blueprintjs/datetime";
import { Icon } from "@blueprintjs/core";

import { makeDNP } from "../../utils";

import { CustomClasses } from "../../constants";


const popoverProps = {
	canEscapeKeyClose: false,
	fill: true,
	minimal: true,
	placement: "bottom",
	popoverClassName: [CustomClasses.POPOVER, CustomClasses.DATE_PICKER].join(" ")
};

const dateProps = {
	formatDate: (date/*, locale */) => makeDNP(date, { brackets: false }),
	parseDate: (str) => new Date(str)
};

function InputDateSingle({ value, setValue }){
	return <DateInput
		{...dateProps}
		className={CustomClasses.DATE_INPUT}
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
		className={CustomClasses.DATE_INPUT_RANGE}
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
