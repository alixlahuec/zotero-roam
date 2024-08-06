import { parseDateInThePast, parseDateRangeInThePast } from "./helpers";


describe("parseDateInThePast", () => {
	beforeAll(() => {
		vi.useFakeTimers()
			.setSystemTime(new Date(2021, 3, 6, 22, 14));
	});

	afterAll(() => {
		vi.useRealTimers();
	});

	const cases = [
		{ query: "bad input", expected: null },
		{ query: "2019", expected: null },
		{ query: "Jan 2019", expected: new Date(2019, 0, 1, 0, 0, 0) },
		{ query: "Jan 13-Jan 17", expected: new Date(2021, 0, 13, 0, 0, 0)},
		{ query: "today", expected: new Date(2021, 3, 6, 0, 0, 0) },
		{ query: "last 2 days", expected: new Date(2021, 3, 4, 0, 0, 0) },
		{ query: "last 2 weeks", expected: new Date(2021, 2, 23, 0, 0, 0)},
		{ query: "this week", expected: new Date(2021, 3, 4, 0, 0, 0) },
		{ query: "this Monday", expected: new Date(2021, 3, 5, 0, 0, 0) },
		{ query: "this month", expected: new Date(2021, 3, 1, 0, 0, 0) },
		{ query: "this year", expected: new Date(2021, 0, 1, 0, 0, 0) }
	];

	test.each(cases)(
		"%# - $query, expect $expected",
		({ query, expected }) => {
			expect(parseDateInThePast(query)).toEqual(expected);
		}
	)
});

describe("parseDateRangeInThePast", () => {
	const currentDatetime = new Date(2021, 3, 6, 22, 14);
	beforeAll(() => {
		vi.useFakeTimers()
			.setSystemTime(currentDatetime);
	});

	afterAll(() => {
		vi.useRealTimers();
	});

	const cases = [
		{ query: "bad input", expected: null },
		{ query: "Jan 2017 - Jan 2020", expected: [new Date(2017, 0, 1, 0, 0, 0), new Date(2020, 1, 1, 0, 0, 0)] },
		{ query: "Jan 3rd - Apr 5th", expected: [new Date(2021, 0, 3, 0, 0, 0), new Date(2021, 3, 6, 0, 0, 0)] },
		{ query: "Jan 2019", expected: [new Date(2019, 0, 1, 0, 0, 0), currentDatetime] },
		{ query: "last 2 days", expected: [new Date(2021, 3, 4, 0, 0, 0), currentDatetime] },
		{ query: "last 2 weeks", expected: [new Date(2021, 2, 23, 0, 0, 0), currentDatetime] },
		{ query: "this week", expected: [new Date(2021, 3, 4, 0, 0, 0), currentDatetime] },
		{ query: "this Monday", expected: [new Date(2021, 3, 5, 0, 0, 0), currentDatetime] },
		{ query: "this month", expected: [new Date(2021, 3, 1, 0, 0, 0), currentDatetime] },
		{ query: "this year", expected: [new Date(2021, 0, 1, 0, 0, 0), currentDatetime] },
		{ query: "Feb 2nd - today", expected: [new Date(2021, 1, 2, 0, 0, 0), new Date(2021, 3, 7, 0, 0, 0)] },
		// this doesn't work well because chrono is confident that the current time should be used in the start date
		{ query: "Feb 2nd - now", expected: [new Date(2021, 1, 2, 22, 14, 0), currentDatetime] },
	];

	test.each(cases)(
		"%# - $query, expect $expected",
		({ query, expected }) => {
			expect(parseDateRangeInThePast(query)).toEqual(expected);
		}
	)
});
