import { memo, useCallback, useMemo } from "react";
import { Button, Classes, Icon, Tag } from "@blueprintjs/core";

import CitekeyPopover from "Components/CitekeyPopover";

import { CustomClasses } from "../../../constants";
import { ShowTypeSemantic } from "../types";
import { SEnrichedItem } from "Types/transforms";


type OwnProps = {
	handleRemove: (value: SEnrichedItem) => void,
	handleSelect: (value: SEnrichedItem) => void,
	inGraph: string | false,
	isSelected: boolean,
	item: SEnrichedItem,
	type: ShowTypeSemantic
};

const SemanticItem = memo<OwnProps>(function SemanticItem(props) {
	const { handleRemove, handleSelect, inGraph, isSelected, item, type } = props;
	const { inLibrary } = item;

	const handleClick = useCallback(() => {
		if(isSelected){
			handleRemove(item);
		} else {
			handleSelect(item);
		}
	}, [isSelected, item, handleRemove, handleSelect]);

	const itemActions = useMemo(() => {
		if(!inLibrary){
			return (
				<>
					{item.url
						? <a zr-role="item-url" href={item.url} target="_blank" rel="noreferrer" className={CustomClasses.TEXT_SMALL} >
							{item.doi || "Semantic Scholar"}
						</a>
						: null}
					{item.doi
						? <Button text={!isSelected ? "Add to Zotero" : "Remove"}
							active={isSelected}
							className={CustomClasses.TEXT_SMALL}
							icon={isSelected ? "small-cross" : "small-plus"}
							intent="primary"
							minimal={true}
							onClick={handleClick}
							small={true} />
						: null}
				</>
			);
		} else {
			const { children: { pdfs, notes }, raw } = inLibrary;
			return (
				<CitekeyPopover inGraph={inGraph} item={raw} notes={notes} pdfs={pdfs} />
			);
		}
	}, [handleClick, inGraph, inLibrary, isSelected, item.doi, item.url]);

	const itemIntents = useMemo(() => {
		return (
			<div className="zr-related-item--intents">
				{item.intent.length > 0
					? item.intent.map(int => {
						const capitalizedIntent = int.charAt(0).toUpperCase() + int.slice(1);
						return <Tag key={int} data-semantic-intent={int} htmlTitle={"This citation was classified as related to " + capitalizedIntent + " by Semantic Scholar"} minimal={true}>{capitalizedIntent}</Tag>;})
					: null}
			</div>
		);
	}, [item.intent]);

	const itemLinks = useMemo(() => {
		return (
			<div className="zr-related-item--links">
				{Object.keys(item.links).map((key) => {
					return (
						<span key={key} data-service={key}>
							<a href={item.links[key]} className={[CustomClasses.TEXT_SMALL, CustomClasses.TEXT_AUXILIARY].join(" ")} target="_blank" rel="noreferrer">{key.split("-").map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(" ")}</a>
						</span>
					);
				})}
			</div>
		);
	}, [item.links]);

	return (
		<li className="zr-related-item" data-semantic-type={type} data-in-library={inLibrary != false} data-in-graph={inGraph != false}>
			<div className={ Classes.MENU_ITEM }>
				<span className={[Classes.MENU_ITEM_LABEL, CustomClasses.TEXT_SMALL, "zr-related-item--timestamp"].join(" ")}>
					{item.year}
				</span>
				<div className={[Classes.FILL, "zr-related-item-contents"].join(" ")}>
					<div className={ Classes.FILL } style={{ display: "flex" }}>
						<div className="zr-related-item-contents--metadata">
							{item.authors && <span className={type == ShowTypeSemantic.REFERENCES ? CustomClasses.TEXT_ACCENT_1 : CustomClasses.TEXT_ACCENT_2}>{item.authors}</span>}
							{item.meta && <span className={CustomClasses.TEXT_SECONDARY}>{item.meta}</span>}
							{item.isInfluential
								? <Icon className="zr-related-item--decorating-icon" color="#f8c63a" htmlTitle="This item was classified as influential by Semantic Scholar" icon="trending-up" />
								: null}
							<span className="zr-related-item--title">{item.title}</span>
							{itemLinks}
						</div>
						<span className="zr-related-item-contents--actions">
							{itemActions}
						</span>
					</div>
					{itemIntents}
				</div>
			</div>
		</li>
	);
});


export default SemanticItem;
