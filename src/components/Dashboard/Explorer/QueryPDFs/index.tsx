import { useEffect, useState } from "react";
import { NonIdealState, Spinner } from "@blueprintjs/core";

import { ListWrapper, Pagination, Toolbar } from "Components/DataList";
import PDFElement from "./PDFElement";

import { usePagination } from "@hooks";

import { cleanLibraryPDF, identifyPDFConnections } from "./helpers";

import { CustomClasses } from "../../../../constants";
import { ZCleanItemPDF, ZLibraryContents } from "Types/transforms";


function cleanLibraryData_PDF(itemList: ZLibraryContents): Promise<ZCleanItemPDF[]>{
	return new Promise((resolve) => {
		setTimeout(() => {
			const data = itemList.pdfs
				.map(pdf => {
					const itemKey = pdf.data.key;
					const parentKey = pdf.data.parentItem;
					const location = pdf.library.type + "s/" + pdf.library.id;
					const { parent, annotations } = identifyPDFConnections(itemKey, parentKey, location, { items: itemList.items, notes: itemList.notes });
					
					return cleanLibraryPDF(pdf, parent, annotations);
				});
			resolve(data);
		}, 0);
	});
}


const itemsPerPage = 20;

type QueryPDFsListProps = {
	items: ZCleanItemPDF[]
};

function QueryPDFsList({ items }: QueryPDFsListProps){
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


function QueryPDFs({ itemList }) {
	const [items, setItems] = useState<ZCleanItemPDF[] | null>(null);

	useEffect(() => {
		if(itemList){
			cleanLibraryData_PDF(itemList)
				.then(data => {
					setItems(data);
				});
		}
	}, [itemList]);

	return items == null
		? <Spinner size={15} />
		: <QueryPDFsList items={items} />;
}


export default QueryPDFs;