import React, { useEffect } from "react";
import { NonIdealState } from "@blueprintjs/core";
import { arrayOf } from "prop-types";

import { ListWrapper, Pagination, Toolbar } from "../../DataList";
import PDFElement from "./PDFElement";

import usePagination from "../../../hooks/usePagination";

import { CustomClasses } from "../../../constants";

import * as customPropTypes from "../../../propTypes";

const itemsPerPage = 20;

function QueryPDFs({ items }){
	const { currentPage, pageLimits, setCurrentPage } = usePagination({ itemsPerPage });

	useEffect(() => {
		setCurrentPage(1);
	}, [items, setCurrentPage]);

	return <div className="zr-query-builder">
		<ListWrapper>
			{items.length > 0
				? items
					.slice(...pageLimits)
					.map((el, i) => <PDFElement key={[el.key, i].join("-")} item={el} />)
				: <NonIdealState className={CustomClasses.TEXT_AUXILIARY} description="No items to display" />}
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