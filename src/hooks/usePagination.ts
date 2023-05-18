import { useCallback, useMemo, useState } from "react";


/**
 * Custom hook for pagination values
 */
const usePagination = ({ itemsPerPage = 20 }: { itemsPerPage?: number }) => {
	const [currentPage, setPage] = useState<number>(1);

	const pageLimits = useMemo<[number, number]>(() => [
		itemsPerPage*(currentPage - 1), 
		itemsPerPage*currentPage
	], [currentPage, itemsPerPage]);

	const setCurrentPage = useCallback((val: number) => {
		setPage(val);
	}, []);

	return { currentPage, pageLimits, setCurrentPage };
};

export { usePagination };