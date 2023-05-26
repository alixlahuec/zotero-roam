import { useEffect } from "react";
import { NonIdealState } from "@blueprintjs/core";

import { ListWrapper, Pagination, Toolbar } from "Components/DataList";
import PDFElement from "./PDFElement";

import { usePagination } from "../../../../hooks";

import { CustomClasses } from "../../../../constants";
import { ZCleanItemPDF } from "Types/transforms";


const itemsPerPage = 20;

type OwnProps = {
	items: ZCleanItemPDF[]
};

function QueryPDFs({ items }: OwnProps){
	const { currentPage, pageLimits, setCurrentPage } = usePagination({ itemsPerPage });

	useEffect(() => {
		setCurrentPage(1);
	}, [items, setCurrentPage]);

	return <div className="zr-query-builder">
		<div className="zr-querypdfs--datalist">
			{items.length == 0
				? <NonIdealState className={CustomClasses.TEXT_AUXILIARY} description="No items to display" />
				: <ListWrapper>
					{items
						.slice(...pageLimits)
						.map((el, i) => <PDFElement key={[el.key, i].join("-")} item={el} />)}
				</ListWrapper>}
		</div>
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


export default QueryPDFs;