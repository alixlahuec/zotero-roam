import React, { useCallback, useState } from "react";
import { arrayOf, object, string } from "prop-types";
import { createPortal } from "react-dom";
import { Button } from "@blueprintjs/core";

import WebImportPanel from "./WebImportPanel";
import "./index.css";

const WebImportButton = React.memo(function WebImportButton({ urls }){
	const [isDialogOpen, setDialogOpen] = useState(false);

	const closePanel = useCallback(() => setDialogOpen(false), []);

	const showImport = useCallback(() => {
		setDialogOpen(true);
	}, []);

	return <>
		<Button className="zr-webimport-button" icon="geosearch" minimal={true} onClick={showImport} />
		<WebImportPanel isOpen={isDialogOpen} onClose={closePanel} urls={urls} />
	</>;
});
WebImportButton.propTypes = {
	urls: arrayOf(string)
};

function WebImportFactory({ divs }){
	return (
		divs.map(div => ({
			div,
			links: div.parentElement.querySelectorAll(".rm-block a:not(.rm-alias--page):not(.rm-alias--block)") || false
		})).filter(div => div.links)
			.map((d, i) => {
				const { div, links } = d;
				const urls = Array.from(links).map(lk => lk.href);
				return (
					createPortal(<WebImportButton key={i} urls={urls} />, div)
				);
			})
	);
}
WebImportFactory.propTypes = {
	divs: arrayOf(object)
};

export default WebImportFactory;
