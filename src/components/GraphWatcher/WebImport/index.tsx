import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@blueprintjs/core";

import WebImportPanel from "./WebImportPanel";

import { useBool } from "@hooks";

import { hasNodeListChanged } from "../helpers";

import "./_index.sass";


type WebImportButtonProps = {
	urls: string[]
};

const WebImportButton = memo<WebImportButtonProps>(function WebImportButton({ urls }){
	const [isDialogOpen, { on: openDialog, off: closeDialog }] = useBool(false);

	return <>
		<Button className="zr-webimport-button" icon="geosearch" minimal={true} onClick={openDialog} />
		<WebImportPanel isOpen={isDialogOpen} onClose={closeDialog} urls={urls} />
	</>;
});


function WebImportFactory({ divs }: { divs: ArrayLike<Element> }){
	// From React Docs : https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
	// https://jasonwatmore.com/post/2021/08/27/react-how-to-check-if-a-component-is-mounted-or-unmounted
	const mounted = useRef(false);
	const [blocksWithLinks, setBlocksWithLinks] = useState<ArrayLike<Element>>([]);

	const updateBlocksWithLinks = useCallback(() => {
		setBlocksWithLinks((prevState) => {
			const currentBlocks = Array.from(divs).filter(div => {
				const links = div?.parentElement?.querySelectorAll(".rm-block a:not(.rm-alias--page):not(.rm-alias--block)") || [];
				return links.length > 0;
			});
			if(hasNodeListChanged(prevState, currentBlocks)){
				return currentBlocks;
			} else {
				return prevState;
			}
		});
	}, [divs]);

	useEffect(() => {
		mounted.current = true;
		const watcher = setInterval(
			() => {
				if(mounted.current){
					updateBlocksWithLinks();
				}
			},
			1000
		);

		return () => {
			mounted.current = false;
			clearInterval(watcher);
		};
	}, [updateBlocksWithLinks]);

	return <>
		{Array.from(blocksWithLinks).map(div => ({
			div,
			links: div.parentElement?.querySelectorAll<HTMLLinkElement>(".rm-block a:not(.rm-alias--page):not(.rm-alias--block)") || []
		})).filter(div => div.links.length > 0)
			.map((d, i) => {
				const { div, links } = d;
				const urls = Array.from(links).map(lk => lk.href);
				return (
					createPortal(<WebImportButton key={i} urls={urls} />, div)
				);
			})}
	</>;
}


export default WebImportFactory;
