import React, { useEffect } from "react";
import { bool, func, string } from "prop-types";
import { Button } from "@blueprintjs/core";

import CitekeyPopover from "../../CitekeyPopover";
import { ListItem } from "../../DataList";
import useBool from "../../../hooks/useBool";

import { CustomClasses } from "../../../constants";
import * as customPropTypes from "../../../propTypes";

function Abstract({ abstract, allAbstractsShown }){
	const [isVisible, { set: setVisible, toggle: toggleAbstract }] = useBool(allAbstractsShown);
	
	useEffect(() => {
		setVisible(allAbstractsShown);
	}, [allAbstractsShown, setVisible]);

	if(!abstract){
		return null;
	} else {
		return (
			<div className="zr-log-item--abstract">
				<Button className={CustomClasses.TEXT_SMALL}
					zr-role="abstract-toggle"
					icon={isVisible ? "chevron-down" : "chevron-right"}
					onClick={toggleAbstract}
					minimal={true} 
					small={true} >
					Abstract
				</Button>
				{isVisible
					? <span zr-role="abstract-text" className={[CustomClasses.TEXT_SMALL, CustomClasses.TEXT_AUXILIARY].join(" ")}>{abstract}</span>
					: null}
			</div>
		);
	}
}
Abstract.propTypes = {
	abstract: string,
	allAbstractsShown: bool
};

const LogItem = React.memo(function LogItem({ allAbstractsShown, item, onClose }){
	const { abstract, children, inGraph, itemType, meta, publication, raw, title } = item;

	return <ListItem className="zr-log-entry" data-in-graph={(inGraph != false).toString()}>
		<div zr-role="item-header">
			<div zr-role="item-details">
				<span className={CustomClasses.TEXT_AUXILIARY} data-item-type={itemType} zr-role="item-title">{title}</span>
				<span className={CustomClasses.TEXT_ACCENT_1}>{meta}</span>
				<span className={CustomClasses.TEXT_SECONDARY}>{publication}</span>
			</div>
			<CitekeyPopover closeDialog={onClose} inGraph={inGraph} item={raw} notes={children.notes} pdfs={children.pdfs} />
		</div>
		<Abstract abstract={abstract} allAbstractsShown={allAbstractsShown} />
	</ListItem>;
});
LogItem.propTypes = {
	allAbstractsShown: bool,
	item: customPropTypes.cleanRecentItemType,
	onClose: func
};

export default LogItem;