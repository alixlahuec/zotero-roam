import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { Button } from "@blueprintjs/core";

const WebImportButton = React.memo(function WebImportButton({ urls }){
	const showImport = useCallback(() => {
		// For testing
		console.log(urls);
	}, [urls]);

	return (
		<Button className="zr-webimport-button" icon="geosearch" minimal={true} onClick={showImport} />
	);
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
	divs: PropTypes.arrayOf(PropTypes.node)
};

export default WebImportFactory;
