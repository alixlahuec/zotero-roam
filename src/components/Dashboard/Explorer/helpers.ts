import { parse as chronoParse } from "chrono-node";


export const parseDateInThePast = (query: string) => {
	const result = chronoParse(query, undefined, { forwardDate: false });

	if (!result.length) return null
	
	const refTime = result[0].refDate;
	const parsedDate = result[0].start;
	const date = parsedDate.date();

	if (!parsedDate.isCertain("year")) {
		date.setFullYear(refTime.getFullYear());
	}

	if (!parsedDate.isCertain("hour")) {
		date.setHours(0, 0, 0, 0);
	}

	return date;
};


export const parseDateRangeInThePast = (query: string) => {
	const result = chronoParse(query, undefined, { forwardDate: false });

	if (!result.length) return null
	
	const refTime = result[0].refDate;

	const parsedStart = result[0].start;
	const startDate = parsedStart.date();
	if (!parsedStart.isCertain("year")) {
		startDate.setFullYear(refTime.getFullYear());
	}
	if (!parsedStart.isCertain("hour")) {
		startDate.setHours(0, 0, 0, 0);
	}

	const parsedEnd = result[0].end;
	let endDate = refTime;
	if (parsedEnd) {
		endDate = parsedEnd.date();

		if (!parsedEnd.isCertain("year")) {
			endDate.setFullYear(refTime.getFullYear());
		}
		if (!parsedEnd.isCertain("day")) {
			if (endDate.getMonth() === 11) {
				endDate.setFullYear(endDate.getFullYear() + 1, 0, 0);
			} else {
				endDate.setMonth(endDate.getMonth() + 1, 0);
			}
		}
		if (!parsedEnd.isCertain("hour")) {
			endDate.setDate(endDate.getDate() + 1);
			endDate.setHours(0, 0, 0, 0);
		}
	}

	console.log({ parsedStart, parsedEnd , startDate, endDate });

	return [startDate, endDate] as const;
}
