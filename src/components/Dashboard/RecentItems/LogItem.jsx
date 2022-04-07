import React, { useCallback, useEffect, useState } from "react";
import { bool, func, string } from "prop-types";
import { Button } from "@blueprintjs/core";

import CitekeyPopover from "../../CitekeyPopover";
import { ListItem } from "../../DataList";

import * as customPropTypes from "../../../propTypes";

function Abstract({ abstract, allAbstractsShown }){
	const [isVisible, setVisible] = useState(allAbstractsShown);

	const toggleAbstract = useCallback(() => setVisible(prevState => !prevState), []);

	useEffect(() => {
		setVisible(allAbstractsShown);
	}, [allAbstractsShown]);

	if(!abstract){
		return null;
	} else {
		return (
			<div className="zr-log-item--abstract">
				<Button className="zr-text-small"
					zr-role="abstract-toggle"
					icon={isVisible ? "chevron-down" : "chevron-right"}
					onClick={toggleAbstract}
					minimal={true} 
					small={true} >
					Abstract
				</Button>
				{isVisible
					? <span zr-role="abstract-text" className="zr-text-small zr-auxiliary">{abstract}</span>
					: null}
			</div>
		);
	}
}
Abstract.propTypes = {
	abstract: string,
	allAbstractsShown: bool
};

function LogItem({ allAbstractsShown, item, onClose }){
	const { abstract, children, inGraph, itemType, meta, publication, raw, title } = item;

	return <ListItem className="zr-log-entry" data-in-graph={(inGraph != false).toString()}>
		<div zr-role="item-header">
			<div zr-role="item-details">
				<span data-item-type={itemType} zr-role="item-title">{title}</span>
				<span className="zr-accent-1">{meta}</span>
				<span className="zr-secondary">{publication}</span>
			</div>
			<CitekeyPopover closeDialog={onClose} inGraph={inGraph} item={raw} notes={children.notes} pdfs={children.pdfs} />
		</div>
		<Abstract abstract={abstract} allAbstractsShown={allAbstractsShown} />
	</ListItem>;
}
LogItem.propTypes = {
	allAbstractsShown: bool,
	item: customPropTypes.cleanRecentItemType,
	onClose: func
};

export default LogItem;