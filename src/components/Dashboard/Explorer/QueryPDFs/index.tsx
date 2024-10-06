import { useEffect, useState } from "react";
import { Spinner } from "@blueprintjs/core";

import QueryBar from "../QueryBar";
import PDFElement from "./PDFElement";

import { cleanLibraryPDF, identifyPDFConnections } from "./helpers";
import { pdfFilters } from "./filters";

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


const renderItem = (item: ZCleanItemPDF) => {
	return <PDFElement key={item.key} item={item} />;
};


function QueryPDFs({ itemList }) {
	const [items, setItems] = useState<ZCleanItemPDF[] | null>(null);
	const [query, setQuery] = useState("");

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
		: <QueryBar filters={pdfFilters} items={items} onQueryChange={setQuery} query={query} renderItem={renderItem} search_field="title" />;
}


export default QueryPDFs;