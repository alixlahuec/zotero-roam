import { memo, useEffect } from "react";
import { Button } from "@blueprintjs/core";

import CitekeyPopover from "Components/CitekeyPopover";
import { ListItem } from "Components/DataList";

import { useBool } from "@hooks";

import { CustomClasses } from "../../../../constants";
import { ZLogItem } from "Types/transforms";

import "./_index.sass";


type AbstractProps = {
	abstract: string,
	allAbstractsShown: boolean
};

function Abstract({ abstract, allAbstractsShown }: AbstractProps){
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


type LogItemProps = {
	allAbstractsShown: boolean,
	item: ZLogItem,
	onClose: () => void
};

const LogItem = memo<LogItemProps>(function LogItem({ allAbstractsShown, item, onClose }){
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


export default LogItem;