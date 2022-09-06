const path = require("path");
const { merge } = require("webpack-merge");
const baseConfig = require("./webpack.config");

module.exports = merge(baseConfig, {
	devtool: false,
	entry: "./sandbox.js",
	experiments: {
        outputModule: true,
    },
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "zoteroRoam.sandbox.js",
		library: {
			type: "module"
		},
		sourceMapFilename: "zoteroRoam.sandbox.js.map"
	},
	resolve: {
		alias: {
			"Mocks": path.resolve(__dirname, "mocks/"),
			"Roam": path.resolve(__dirname, "mocks/roam.js")
		},
		extensions: [".js", ".jsx", ".css"]
	}
});