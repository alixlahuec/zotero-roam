const path = require("path");

module.exports = {
	context: path.resolve(__dirname, '../'),
	devtool: "source-map",
	entry: path.resolve("src", "index.js"),
	output: {
		path: path.resolve("dist"),
		filename: "zoteroRoam.min.js",
		sourceMapFilename: "zoteroRoam.min.js.map"
	},
	resolve: {
        alias: {
            "Mocks": path.resolve("mocks"),
            "Roam": path.resolve("src", "roam.js")
        },
		extensions: [".js", ".jsx", ".css"]
	},
	mode: "production",
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				include: path.resolve("src"),
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
    },
    performance: {
        maxAssetSize: 2000000,
        maxEntrypointSize: 2000000,
    }
};