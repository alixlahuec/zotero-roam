import React, { useCallback, useMemo } from "react";
import { func, node, number, oneOf, string } from "prop-types";
import { Button, ControlGroup } from "@blueprintjs/core";

import "./index.css";
import { pluralize } from "../../utils";

const ListItem = ({ className, children, ...rest }) => 
	<li className={[className, "zr-datalist--item"].filter(Boolean).join(" ")} {...rest}>
		{children}
	</li>;
ListItem.propTypes = {
	className: string,
	children: node
};

const ListWrapper = ({ children }) => <ul className="zr-datalist--listwrapper">{children}</ul>;
ListWrapper.propTypes = {
	children: node
};

const Pagination = React.memo(function Pagination({ arrows = "last", currentPage, itemsPerPage = 30, nbItems, setCurrentPage }){
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
		<span className="zr-text-small" zr-role="items-count">
			<strong>{(currentPage - 1)*itemsPerPage + 1}-{Math.min(currentPage*itemsPerPage, nbItems)}</strong> / {pluralize(nbItems, "item")}
		</span>);

	const controls = (
		<ControlGroup>
			<Button disabled={currentPage == 1} icon="chevron-left" minimal={true} onClick={goToPrevious} />
			<Button disabled={currentPage >= nbPages} icon="chevron-right" minimal={true} onClick={goToNext} />
		</ControlGroup>
	);
	
	return nbItems > 0
		? <div className="zr-datalist--pagination">
			{arrows == "first" && controls}
			{itemsCount}
			{arrows == "last" && controls}
		</div>
		: null;
});
Pagination.propTypes = {
	arrows: oneOf(["first", "last"]),
	currentPage: number,
	itemsPerPage: number,
	nbItems: number,
	setCurrentPage: func
};

const Toolbar = ({ children }) => <div className="zr-datalist--toolbar">{children}</div>;
Toolbar.propTypes = {
	children: node
};


export {
	ListItem,
	ListWrapper,
	Pagination,
	Toolbar
};
