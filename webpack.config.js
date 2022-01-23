const path = require("path");

module.exports = {
	context: __dirname,
	entry: path.resolve(__dirname, "src", "index.js"),
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "zoteroRoam.min.js"
	},
	resolve: {
		extensions: [".js", ".jsx", ".css"],
		alias: {
			"react-dom$": "react-dom/profiling",
			"scheduler/tracing": "scheduler/tracing-profiling"
		}
	},
	mode: "production",
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				include: path.resolve(__dirname, "src"),
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env", "@babel/preset-react"]
					}
				}
			},
			{
				test: /\.css$/i,
				use: ["style-loader", "css-loader"]
			}
		]
	}
};