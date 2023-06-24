const path = require("path");
const { merge } = require("webpack-merge");
const baseConfig = require("./webpack.config");

module.exports = merge(baseConfig, {
	devtool: false,
	entry: path.resolve("sandbox.ts"),
	experiments: {
        outputModule: true,
    },
	output: {
		path: path.resolve("dist"),
		filename: "zoteroRoam.sandbox.js",
		library: {
			type: "module"
		},
		sourceMapFilename: "zoteroRoam.sandbox.js.map"
	},
	module: {
		rules: [
			{
				test: /\.[tj]sx?$/,
				include: [path.resolve("src"), path.resolve("mocks"), path.resolve("sandbox.ts")],
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"]
					}
				}
			}
		]
	},
	resolve: {
		alias: {
			"Mocks": path.resolve("mocks"),
			"Roam": path.resolve("mocks", "roam.ts"),
			"Components": path.resolve("src", "components"),
			"Types": path.resolve("src", "types")
		},
		extensions: [".js", ".jsx", ".ts", ".tsx", ".css", ".scss"]
	}
});