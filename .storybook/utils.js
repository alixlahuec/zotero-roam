// Function to emulate pausing between interactions
// https://storybook.js.org/docs/react/writing-stories/play-function
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export {
    sleep
};