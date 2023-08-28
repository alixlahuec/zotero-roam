import * as path from "path";
import { StorybookConfig } from "@storybook/react-webpack5";


const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)", "../stories/*.stories.@(js|jsx|ts|tsx)"],
	addons: [
		"@storybook/addon-a11y",
		"@storybook/addon-controls",
		"@storybook/addon-coverage",
		"@storybook/addon-links",
		"@storybook/addon-essentials",
		"@storybook/addon-interactions",
		{
			name: '@storybook/addon-styling',
			options: {
				sass: {
					implementation: require('sass'),
				},
			},
		}
	],
	framework: {
		name: "@storybook/react-webpack5",
		options: {
			builder: {
				useSWC: true
			},
			legacyRootApi: true
		}
	},
	staticDirs: ["../public"],
	/* eslint-disable-next-line require-await */
	babel: async (config) => {
		return {
			"presets": [
				"@babel/preset-env",
				[
					"@babel/preset-react",
					{
						"runtime": "automatic"
					}
				],
				"@babel/preset-typescript"
			],
			...config
		};
	},
	/* eslint-disable-next-line require-await */
	webpackFinal: async (config) => {
		return {
			...config,
			devtool: false,
			optimization: {
				...config.optimization,
				minimize: false,
				minimizer: []
			},
			resolve: {
				...config.resolve,
				alias: {
					"Mocks": path.resolve(__dirname, "..", "mocks"),
					"Roam": path.resolve(__dirname, "..", "mocks", "roam.ts"),
					"Components": path.resolve(__dirname, "..", "src", "components"),
					"Styles": path.resolve(__dirname, "..", "styles"),
					"Types": path.resolve(__dirname, "..", "src", "types")
				}
			}
		};
	}
};

export default config;