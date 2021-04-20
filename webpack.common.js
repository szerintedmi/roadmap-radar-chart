const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");

module.exports = {
  entry: "./src/index.ts",

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },

      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|json|csv|tsv)$/i,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "webpack Boilerplate",
      template: path.resolve(__dirname, "./src/index.html"),
      filename: "index.html",
    }),
    new CopyPlugin({
      patterns: [
        { from: "exampleData", to: "exampleData" },
        { from: "src/svgtest.html", to: "svgtest.html" },
      ],
    }),
    new FaviconsWebpackPlugin({
      logo: "./static/logo.png",
      favicons: {
        icons: {
          appleStartup: false,
        },
      },
    }),
  ],
};
