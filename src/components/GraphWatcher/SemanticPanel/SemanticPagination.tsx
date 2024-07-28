import { memo, useCallback, useMemo } from "react";
import { InputGroup, NonIdealState } from "@blueprintjs/core";

import { ListWrapper, Pagination, Toolbar } from "Components/DataList";
import FilterSelect from "Components/DataList/FilterSelect";
import { SemanticGuide } from "Components/Guide";
import SemanticItem from "./SemanticItem";

import { Filter, useFilterList, usePagination, useText } from "@hooks";

import { ShowTypeSemantic } from "../types";

import { CustomClasses } from "../../../constants";
import { searchEngine } from "../../../utils";
import { AsBoolean } from "Types/helpers";
import { SEnrichedItem, isSBacklink } from "Types/transforms";


const itemsPerPage = 30;

const SEMANTIC_FILTER_OPTIONS: Filter[] = [
	{ active: false, label: "In Library", value: "library" },
	{ active: false, label: "Highly Influential", value: "influential" },
	{ active: false, label: "Has DOI", value: "doi" }
];

function filter(items: SEnrichedItem[], filterList: Filter[]){
	let arr = [...items];
	const activeFilters = filterList.filter(op => op.active == true);

	activeFilters.forEach(op => {
		switch(op.value){
		case "library":
			arr = arr.filter(isSBacklink);
			break;
		case "influential":
			arr = arr.filter(item => item.isInfluential);
			break;
		case "doi":
			arr = arr.filter(item => item.doi);
			break;
		default:
			window.zoteroRoam?.warn?.({
				origin: "Interface",
				message: `Filter not recognized: ${op.value}`,
				context: {
					...op
				}
			});
		}
	});

	return arr;
}

function search(query: string, items: SEnrichedItem[]){
	return items.filter(it => searchEngine(
		query, 
		it._multiField,
		{
			any_case: true, 
			match: "partial", 
			search_compounds: true, 
			word_order: "loose"
		}
	));
}


type ItemProps = {
	item: SEnrichedItem,
	selectProps: {
		handleRemove: (value: SEnrichedItem) => void,
		handleSelect: (value: SEnrichedItem) => void,
		items: SEnrichedItem[],
		resetImport: () => void
	},
	type: ShowTypeSemantic
};

function Item({ item, selectProps, type }: ItemProps){
	const { handleRemove, handleSelect, items: selectedItems } = selectProps;
	const isSelected = selectedItems.findIndex(i => i.doi == item.doi || i.url == item.url) >= 0;

	return <SemanticItem
		handleRemove={handleRemove} 
		handleSelect={handleSelect} 
		inGraph={item.inGraph} 
		isSelected={isSelected}
		item={item} 
		type={type} />;
}


export type SemanticPaginationProps = {
	items: SEnrichedItem[],
} & Pick<ItemProps, "selectProps" | "type">;

const SemanticPagination = memo<SemanticPaginationProps>(function SemanticPagination(props){
	const { items, selectProps, type } = props;
	const { currentPage, pageLimits, setCurrentPage } = usePagination({ itemsPerPage });
	const [query, onQueryChange] = useText("");
	const [filterList, toggleFilter] = useFilterList(SEMANTIC_FILTER_OPTIONS);

	const handleFilter = useCallback((value) => {
		toggleFilter(value);
		setCurrentPage(1);
	}, [setCurrentPage, toggleFilter]);

	const filteredItems = useMemo(() => filter(items, filterList), [filterList, items]);

	const queriedItems = useMemo(() => !query ? filteredItems : search(query, filteredItems), [filteredItems, query]);

	return (
		<div className="rendered-div">
			<Toolbar>
				<FilterSelect options={filterList} toggleFilter={handleFilter} />
				<InputGroup
					aria-label="Search by title, authors (last names), or year"
					autoComplete="off"
					id={"semantic-search--" + type}
					leftIcon="search"
					onChange={onQueryChange}
					placeholder="Search items"
					spellCheck="false"
					title="Search by title, authors (last names), or year"
					value={query} />
			</Toolbar>
			<div className="zr-semantic--datalist">
				{queriedItems.length == 0
					? <NonIdealState className={CustomClasses.TEXT_AUXILIARY} description="No results found" />
					: <ListWrapper>
						{queriedItems
							.slice(...pageLimits)
							.map(el => 
								<Item key={[el.doi, el.url, el.title].filter(AsBoolean).join("-")} 
									item={el} selectProps={selectProps} type={type} />)}
					</ListWrapper>
				}
			</div>
			<Toolbar>
				<Pagination
					arrows="first"
					currentPage={currentPage} 
					itemsPerPage={itemsPerPage}
					nbItems={queriedItems.length} 
					setCurrentPage={setCurrentPage} />
				<SemanticGuide />
			</Toolbar>
		</div>
	);
});


export default SemanticPagination;
