import { useCallback, useMemo, useState } from "react";


/** Custom hook for handling list pagination
 */
const usePagination = ({ itemsPerPage = 20 }) => {
	const [currentPage, setPage] = useState<number>(1);

	const pageLimits = useMemo(() => [
		itemsPerPage*(currentPage - 1), 
		itemsPerPage*currentPage
	], [currentPage, itemsPerPage]);

	const setCurrentPage = useCallback((val: number) => {
		setPage(val);
	}, []);

	return { currentPage, pageLimits, setCurrentPage };
};

export default usePagination;