import { DateInput, DateInputProps, DateRange, DateRangeInput, DateRangeInputProps } from "@blueprintjs/datetime";
import { IPopoverProps, Icon } from "@blueprintjs/core";

import { makeDNP } from "../../utils";
import { CustomClasses } from "../../constants";


const popoverProps: Partial<IPopoverProps> = {
	canEscapeKeyClose: false,
	fill: true,
	minimal: true,
	placement: "bottom",
	popoverClassName: [CustomClasses.POPOVER, CustomClasses.DATE_PICKER].join(" ")
};

const dateProps: Pick<DateInputProps, "formatDate" | "parseDate"> = {
	formatDate: (date/*, locale */) => makeDNP(date, { brackets: false }),
	parseDate: (str) => new Date(str)
};


type InputDateSingleProps = {
	value: Date,
	setValue: NonNullable<DateInputProps["onChange"]>
};

function InputDateSingle({ value, setValue }: InputDateSingleProps) {
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


type InputDateRangeProps = {
	value: DateRange,
	setValue: NonNullable<DateRangeInputProps["onChange"]>
};

function InputDateRange({ value, setValue }: InputDateRangeProps) {
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

export {
	InputDateSingle,
	InputDateRange
};
