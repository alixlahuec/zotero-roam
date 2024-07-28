import { Icon } from "@blueprintjs/core";
import { DateInput, DateInputProps, DateRange, DateRangeInput, DateRangeInputProps } from "@blueprintjs/datetime";

import { makeDNP } from "@services/roam";
import { CustomClasses } from "../../constants";


const popoverProps: DateInputProps["popoverProps"] = {
	canEscapeKeyClose: false,
	fill: true,
	minimal: true,
	placement: "bottom",
	popoverClassName: [CustomClasses.POPOVER, CustomClasses.DATE_PICKER].join(" ")
};

const staticProps: Pick<DateInputProps, "formatDate" | "parseDate"> = {
	formatDate: (date/*, locale */) => makeDNP(date, { brackets: false }),
	parseDate: (str) => new Date(str)
};


type InputDateSingleProps = {
	value: Date,
	setValue: NonNullable<DateInputProps["onChange"]>
};

function InputDateSingle({ value, setValue }: InputDateSingleProps) {
	return <DateInput
		className={CustomClasses.INPUT_BOX}
		closeOnSelection={true}
		highlightCurrentDay={true}
		onChange={setValue}
		placeholder="Date"
		popoverProps={popoverProps}
		rightElement={<Icon icon="timeline-events" />}
		shortcuts={false}
		value={value}
		{...staticProps}
	/>;
}


type InputDateRangeProps = {
	value: DateRange,
	setValue: NonNullable<DateRangeInputProps["onChange"]>
};

function InputDateRange({ value, setValue }: InputDateRangeProps) {
	return <DateRangeInput
		className={CustomClasses.INPUT_DATE_RANGE}
		closeOnSelection={true}
		highlightCurrentDay={true}
		onChange={setValue}
		popoverProps={popoverProps}
		shortcuts={false}
		value={value}
		{...staticProps}
	/>;
}

export {
	InputDateSingle,
	InputDateRange
};
