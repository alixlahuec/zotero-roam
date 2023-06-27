import { FC, memo, useCallback, useMemo } from "react";
import { Button, ControlGroup } from "@blueprintjs/core";

import { pluralize } from "../../utils";
import { CustomClasses } from "../../constants";

import { AsBoolean } from "Types/helpers";
import "./_index.sass";


type ListItemProps = { className?: string };

const ListItem: FC<ListItemProps & JSX.IntrinsicElements["li"]> = ({ className = null, children, ...rest }) => (
	<li className={[className, CustomClasses.DATALIST_ITEM].filter(AsBoolean).join(" ")} {...rest}>
		{children}
	</li>
);


const ListWrapper: FC = ({ children }) => <ul className={CustomClasses.DATALIST_WRAPPER}>{children}</ul>;


type PaginationProps = {
	arrows?: "first" | "last",
	currentPage: number,
	itemsPerPage?: number,
	nbItems: number,
	setCurrentPage: (value: number) => void
};

const Pagination = memo<PaginationProps>(function Pagination({ arrows = "last", currentPage, itemsPerPage = 30, nbItems, setCurrentPage }){
	const nbPages = useMemo(() => nbItems == 0 ? 0 : Math.ceil(nbItems / itemsPerPage), [itemsPerPage, nbItems]);
	const goToNext = useCallback(() => {
		if(currentPage < nbPages){
			setCurrentPage(currentPage + 1);
		}
	}, [currentPage, nbPages, setCurrentPage]);
	const goToPrevious = useCallback(() => {
		if(currentPage > 1){
			setCurrentPage(currentPage - 1);
		}
	}, [currentPage, setCurrentPage]);

	const itemsCount = (
		<span className={CustomClasses.TEXT_SMALL} zr-role="items-count">
			<strong>{(currentPage - 1)*itemsPerPage + 1}-{Math.min(currentPage*itemsPerPage, nbItems)}</strong> / {pluralize(nbItems, "item")}
		</span>);

	const controls = (
		<ControlGroup>
			<Button aria-disabled={currentPage == 1} disabled={currentPage == 1} icon="chevron-left" minimal={true} onClick={goToPrevious} title="Go to previous page of results" />
			<Button aria-disabled={currentPage >= nbPages} disabled={currentPage >= nbPages} icon="chevron-right" minimal={true} onClick={goToNext} title="Go to next page of results" />
		</ControlGroup>
	);
	
	return <div className={CustomClasses.DATALIST_PAGINATION}>
		{nbItems > 0
			? <>
				{arrows == "first" && controls}
				{itemsCount}
				{arrows == "last" && controls}
			</>
			: null}
	</div>;
});


const Toolbar: FC = ({ children }) => <div className={CustomClasses.DATALIST_TOOLBAR}>{children}</div>;


export {
	ListItem,
	ListWrapper,
	Pagination,
	Toolbar
};
