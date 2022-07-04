const path = require("path");

module.exports = {
	context: __dirname,
	devtool: "source-map",
	entry: path.resolve(__dirname, "src", "index.js"),
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "zoteroRoam.min.js",
		sourceMapFilename: "zoteroRoam.min.js.map"
	},
	resolve: {
        alias: {
            "Roam": path.resolve(__dirname, "src/roam.js")
        },
		extensions: [".js", ".jsx", ".css"]
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