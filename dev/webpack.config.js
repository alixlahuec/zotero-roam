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
            "Roam": path.resolve("src", "roam.js"),
			"Components": path.resolve("src", "components"),
			"Types": path.resolve("src", "types")
        },
		extensions: [".js", ".jsx", ".ts", ".tsx", ".css"]
	},
	mode: "production",
	module: {
		rules: [
			{
				test: /\.[tj]sx?$/,
				include: path.resolve("src"),
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"]
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