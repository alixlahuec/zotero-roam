const path = require("path");


module.exports = {
	"stories": ["../src/**/*.stories.@(js|jsx|ts|tsx)", "../stories/*.stories.@(js|jsx|ts|tsx)"],
	"addons": ["@storybook/addon-a11y", "@storybook/addon-controls", "@storybook/addon-coverage", "@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions"],
	"framework": "@storybook/react",
	features: {
		interactionsDebugger: true,
	},
	core: {
		builder: "webpack5"
	},
	staticDirs: ["../public"],
	/* eslint-disable-next-line require-await */
	webpackFinal: async (config) => {
		return {
			...config,
			resolve: {
				...config.resolve,
				alias: {
					"Mocks": path.resolve(__dirname, "..", "mocks"),
					"Roam": path.resolve(__dirname, "..", "mocks", "roam.js"),
					"Components": path.resolve(__dirname, "..", "src", "components"),
					"Types": path.resolve(__dirname, "..", "src", "types")
				}
			}
		};
	},
};