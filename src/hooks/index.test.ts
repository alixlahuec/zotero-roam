import { ChangeEvent, FormEvent } from "react";
import { act, renderHook } from "@testing-library/react-hooks";
import { useFilterList, useBool, useMulti, useNumeric, usePagination, useSelect, useText, useToggle, useArrayReducer } from ".";


describe("Hook for array reducer", () => {
	const initialState = ["some value", "another value"];

	test("Add an element", () => {
		const { result } = renderHook(() => useArrayReducer(initialState));

		act(() => {
			result.current[1]({ type: "add", value: "added value" });
		});

		expect(result.current[0])
			.toEqual([
				...initialState,
				"added value"
			]);
	});

	test("Remove an element", () => {
		const { result } = renderHook(() => useArrayReducer(initialState));

		act(() => {
			result.current[1]({ type: "remove", index: 1 });
		});

		expect(result.current[0])
			.toEqual([initialState[0]]);
	});

	test("Update an element", () => {
		const { result } = renderHook(() => useArrayReducer(initialState));

		act(() => {
			result.current[1]({ type: "update", index: 0, value: "replaced value" });
		});

		expect(result.current[0])
			.toEqual(["replaced value", initialState[1]]);
	});
});

describe("Hook for boolean state", () => {
	test("Toggle method", () => {
		const { result } = renderHook(() => useBool(false));
    
		expect(result.current[0]).toBe(false);
    
		act(() => {
			result.current[1].toggle();
		});
    
		expect(result.current[0]).toBe(true);
	});

	test("Set method", () => {
		const { result } = renderHook(() => useBool(false));
        
		act(() => {
			result.current[1].set(true);
		});

		expect(result.current[0]).toBe(true);

		act(() => {
			result.current[1].set(false);
		});

		expect(result.current[0]).toBe(false);
	});

	test("Switch on", () => {
		const { result } = renderHook(() => useBool(false));

		act(() => {
			result.current[1].on();
		});

		expect(result.current[0]).toBe(true);
	});

	test("Switch off", () => {
		const { result } = renderHook(() => useBool(true));

		act(() => {
			result.current[1].off();
		});

		expect(result.current[0]).toBe(false);
	});
});

describe("Hook for filters list", () => {
	const initialList = [
		{ active: false, label: "Some filter", value: "some_filter" },
		{ active: true, label: "Another filter", value: "another_filter" }
	];

	test("Toggle filter on", () => {
		const { result } = renderHook(() => useFilterList(initialList));

		act(() => {
			result.current[1]("some_filter");
		});

		expect(result.current[0])
			.toEqual([
				{ active: true, label: "Some filter", value: "some_filter" },
				{ active: true, label: "Another filter", value: "another_filter" }
			]);
	});

	test("Toggle filter off", () => {
		const { result } = renderHook(() => useFilterList(initialList));

		act(() => {
			result.current[1]("another_filter");
		});

		expect(result.current[0])
			.toEqual([
				{ active: false, label: "Some filter", value: "some_filter" },
				{ active: false, label: "Another filter", value: "another_filter" }
			]);
	});
});

describe("Hook for multiple selection state", () => {
	test("Behavior with base config", () => {
		const { result } = renderHook(() => useMulti({}));

		expect(result.current[0]).toEqual([]);

		act(() => {
			result.current[1].add("Some value");
		});

		expect(result.current[0]).toEqual(["Some value"]);

		act(() => {
			result.current[1].toggle("Another value");
		});

		expect(result.current[0]).toEqual(["Some value", "Another value"]);

		act(() => {
			result.current[1].add("Some value");
		});

		expect(result.current[0]).toEqual(["Some value", "Another value"]);

		act(() => {
			result.current[1].remove("Some value");
		});

		expect(result.current[0]).toEqual(["Another value"]);

		act(() => {
			result.current[1].toggle("Another value");
		});

		expect(result.current[0]).toEqual([]);

		act(() => {
			result.current[1].set(["Enforced", "value"]);
		});

		expect(result.current[0]).toEqual(["Enforced", "value"]);

		act(() => {
			result.current[1].set([]);
		});

		expect(result.current[0]).toEqual([]);
	});

	test("With custom match functions", () => {
		const options = [
			{ title: "Option X", value: "x" },
			{ title: "Option Y", value: "y" },
			{ title: "Option Z", value: "z" }
		];

		function identify(item, value){
			return item.value == value;
		}

		function retrieve(value){
			return options.find(op => op.value == value);
		}

		const { result } = renderHook(() => useMulti({ start: [], identify, retrieve }));

		expect(result.current[0]).toEqual([]);

		act(() => {
			result.current[1].add("y");
		});

		expect(result.current[0]).toEqual([
			{ title: "Option Y", value: "y" }
		]);

		act(() => {
			result.current[1].remove("y");
		});

		expect(result.current[0]).toEqual([]);
	});
});

test("Hook for numeric state", () => {
	const { result } = renderHook(() => useNumeric());

	expect(result.current[0]).toBe(0);

	act(() => {
		result.current[1](999, "13");
	});

	expect(result.current[0]).toBe(13);
});

test("Hook for pagination", () => {
	const { result } = renderHook(() => usePagination({}));

	expect(result.current.currentPage).toBe(1);
	expect(result.current.pageLimits).toEqual([0,20]);

	act(() => {
		result.current.setCurrentPage(3);
	});

	expect(result.current.currentPage).toBe(3);
	expect(result.current.pageLimits).toEqual([40,60]);
});

describe("Hook for single selection state", () => {
	test("Behavior with base config", () => {
		const { result } = renderHook(() => useSelect({ start: null }));

		expect(result.current[0]).toBe(null);

		act(() => {
			result.current[1]({ currentTarget: { value: "Some value" } } as FormEvent<HTMLInputElement>);
		});

		expect(result.current[0]).toBe("Some value");
	});

	test("With custom transform function", () => {
		function transform(value){
			return {
				title: value.toLowerCase()
			};
		}

		const { result } = renderHook(() => useSelect({ start: null, transform }));

		expect(result.current[0]).toBe(null);

		act(() => {
			result.current[1]({ currentTarget: { value: "TEXT" } } as FormEvent<HTMLInputElement>);
		});

		expect(result.current[0]).toEqual({
			title: "text"
		});
	});
});

test("Hook for text state", () => {
	const { result } = renderHook(() => useText());

	expect(result.current[0]).toBe("");

	act(() => {
		result.current[1]({ target: { value: "query" } } as ChangeEvent<HTMLInputElement>);
	});

	expect(result.current[0]).toBe("query");
});

describe("Hook for toggle state", () => {
	test("Toggle method", () => {
		const { result } = renderHook(() => useToggle({ start: "Initial value", options: ["Initial value", "Alternative value"] }));

		expect(result.current[0]).toBe("Initial value");

		act(() => {
			result.current[1]();
		});

		expect(result.current[0]).toBe("Alternative value");
	});

});