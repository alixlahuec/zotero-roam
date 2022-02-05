import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { Button } from "@blueprintjs/core";

import WebImportPanel from "./WebImportPanel";

const WebImportButton = React.memo(function WebImportButton({ urls }){
	const [isDialogOpen, setDialogOpen] = useState(false);

	const closePanel = useCallback(() => setDialogOpen(false), []);

	const showImport = useCallback(() => {
		// For testing
		console.log(urls);
		setDialogOpen(true);
	}, [urls]);

	return <>
		<Button className="zr-webimport-button" icon="geosearch" minimal={true} onClick={showImport} />
		<WebImportPanel isOpen={isDialogOpen} onClose={closePanel} urls={urls} />
	</>;
});
WebImportButton.propTypes = {
	urls: PropTypes.arrayOf(PropTypes.string)
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
	divs: PropTypes.arrayOf(PropTypes.element)
};

export default WebImportFactory;
