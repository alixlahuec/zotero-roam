import React, { useEffect } from 'react';

/** Create a Scite badge element, for manual rendering through window.__SCITE.insertBadges()
 * @param {string} doi - The DOI for which the badge should be made
 * @param {string} layout - Should the badge be horizontal or vertical ?
 * @param {Boolean} showLabels - Should the badge display category labels ?
 * @param {Boolean} showZero - Should the badge include categories that contain no citing paper ?
 * @param {Boolean} small - Should the badge have a small appearance ?
 * @param {string} tooltipPlacement - Where should the tooltip be displayed ?
 * @param {Integer} tooltipSlide - Should the tooltip be positioned with offset ? 
 **/
const SciteBadge = React.memo(props => {
    const {
        doi,
        layout = "horizontal",
        showLabels = "false",
        showZero = "true",
        small = "false",
        tooltipPlacement = "auto",
        tooltipSlide = "0"
    } = props;

    useEffect(() => {
        window.__SCITE?.insertBadges();
    })

    return (
        <div className="scite-badge" 
        data-doi={doi} 
        data-layout={layout} 
        data-show-labels={showLabels} 
        data-show-zero={showZero} 
        data-small={small} 
        data-tooltip-placement={tooltipPlacement} 
        data-tooltip-slide={tooltipSlide}>
        </div>
    )
})

export default SciteBadge;