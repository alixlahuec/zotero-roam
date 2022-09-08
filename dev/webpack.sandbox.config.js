const path = require("path");
const { merge } = require("webpack-merge");
const baseConfig = require("./webpack.config");

module.exports = merge(baseConfig, {
	devtool: false,
	entry: path.resolve("sandbox.js"),
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
	resolve: {
		alias: {
			"Mocks": path.resolve("mocks"),
			"Roam": path.resolve("mocks", "roam.js")
		},
		extensions: [".js", ".jsx", ".css"]
	}
});