import { useCallback, useMemo, useState } from "react";


/** Custom hook for pagination values
 * @param {{itemsPerPage: number}} config
 * @returns 
 */
const usePagination = ({ itemsPerPage = 20 }) => {
	const [currentPage, setPage] = useState(1);

	const pageLimits = useMemo(() => [
		itemsPerPage*(currentPage - 1), 
		itemsPerPage*currentPage
	], [currentPage, itemsPerPage]);

	const setCurrentPage = useCallback((val) => {
		setPage(val);
	}, []);

	return { currentPage, pageLimits, setCurrentPage };
};

export { usePagination };