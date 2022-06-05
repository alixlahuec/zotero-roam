import React, { useEffect, useMemo, useState } from "react";
import { NonIdealState } from "@blueprintjs/core";
import { arrayOf } from "prop-types";

import { ListWrapper, Pagination, Toolbar } from "../../DataList";
import PDFElement from "./PDFElement";

import * as customPropTypes from "../../../propTypes";

const itemsPerPage = 20;

function QueryPDFs({ items }){
	const [currentPage, setCurrentPage] = useState(1);
	const pageLimits = useMemo(() => [itemsPerPage*(currentPage - 1), itemsPerPage*currentPage], [currentPage]);

	useEffect(() => {
		setCurrentPage(1);
	}, [items]);

	return <div className="zr-query-builder">
		<ListWrapper>
			{items.length > 0
				? items
					.slice(...pageLimits)
					.map((el, i) => <PDFElement key={[el.key, i].join("-")} item={el} />)
				: <NonIdealState className="zr-auxiliary" description="No items to display" />}
		</ListWrapper>
		<Toolbar>
			<Pagination
				arrows="first" 
				currentPage={currentPage} 
				itemsPerPage={itemsPerPage} 
				nbItems={items.length} 
				setCurrentPage={setCurrentPage} 
			/>
		</Toolbar>
	</div>;
}
QueryPDFs.propTypes = {
	items: arrayOf(customPropTypes.cleanLibraryPDFType)
};

export default QueryPDFs;