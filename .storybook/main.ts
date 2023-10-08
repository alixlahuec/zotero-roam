import * as path from "path";
import { mergeConfig } from "vite";
import { StorybookConfig } from "@storybook/react-vite";
import turbosnap from "vite-plugin-turbosnap";
import istanbul from "rollup-plugin-istanbul";


const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)", "../stories/*.stories.@(js|jsx|ts|tsx)"],
	addons: [
		"@storybook/addon-a11y",
		"@storybook/addon-controls",
		"@storybook/addon-links",
		"@storybook/addon-essentials",
		"@storybook/addon-interactions"
	],
	core: {
		builder: "@storybook/builder-vite"
	},
	framework: {
		name: "@storybook/react-vite",
		options: {
			legacyRootApi: true
		}
	},
	staticDirs: ["../public"],
	/* eslint-disable-next-line require-await */
	viteFinal: async (config, { configType }) => {
		return mergeConfig(config, {
			mode: "storybook",
			minify: false,
			sourcemap: false,
			resolve: {
				...config.resolve,
				alias: {
					"Mocks": path.resolve(__dirname, "..", "mocks"),
					"Roam": path.resolve(__dirname, "..", "mocks", "roam.ts"),
					"Components": path.resolve(__dirname, "..", "src", "components"),
					"Styles": path.resolve(__dirname, "..", "styles"),
					"Types": path.resolve(__dirname, "..", "src", "types")
				}
			},
			plugins: [istanbul({ include: ["mocks/**", "src/**/*.ts", "src/**/*.tsx", "stories/**"]}), turbosnap({ rootDir: path.resolve(__dirname, "..") })]
		})
	}
};

export default config;