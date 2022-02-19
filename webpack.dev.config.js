const { merge } = require("webpack-merge");
const baseConfig = require("./webpack.config");

module.exports = merge(baseConfig, {
	mode: "development",
	optimization: {
		minimize: false
	},
    output: {
        filename: "zoteroRoam.dev.js"
    },
	resolve: {
		alias: {
			"react-dom$": "react-dom/profiling",
			"scheduler/tracing": "scheduler/tracing-profiling"
		}
	}
});