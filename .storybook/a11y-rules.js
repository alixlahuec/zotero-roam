export const A11Y_RULES = [
    {
        id: "color-contrast",
        // axe-playwright currently generates inconsistent results for color contrast.
        // Mark violations for review rather than triggering a fail
        reviewOnFail: true,
        // Contrast check always returns incomplete for QuickCopy toggle,
        // which is due to background being provided by the sibling `input` element.
        selector: "*:not(label.zr-quick-copy)"
    },
    {
        id: "aria-progressbar-name",
        // The loading state for Blueprint's Button doesn't provide a title to the spinner.
        // This currently cannot be configured
        selector: "[role=\"progressbar\"]:not(.bp4-button-spinner)"
    },
    {
        id: "aria-allowed-attr",
        // Blueprint's Tag sets an aria-labelledby attribute to the span wrapper,
        // which is incorrect for <span> elements without a valid aria-role.
        // This currently cannot be configured
        selector: "*:not(.bp4-tag)"
    },
    {
        id: "image-alt",
        // Scite's logo doesn't provide alt text, resulting in a violation
        selector: "img:not([src=\"https://cdn.scite.ai/assets/images/logo.svg\"])"
    }
];