const { merge } = require("webpack-merge");
const baseConfig = require("./webpack.config");

module.exports = merge(baseConfig, {
	mode: "development",
	optimization: {
		minimize: false
	},
    output: {
        filename: "zoteroRoam.dev.js",
		sourceMapFilename: "zoteroRoam.dev.js.map"
    },
	resolve: {
		alias: {
			"react-dom$": "react-dom/profiling",
			"scheduler/tracing": "scheduler/tracing-profiling"
		}
	}
});