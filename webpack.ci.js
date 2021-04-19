const { RelativeCiAgentWebpackPlugin } = require("@relative-ci/agent");
const { StatsWriterPlugin } = require("webpack-stats-plugin");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "production",

  devtool: false,

  plugins: [
    new RelativeCiAgentWebpackPlugin(), // Write out stats file to build directory.

    new StatsWriterPlugin({
      filename: "webpack-stats.json",
      stats: {
        context: "./src", // optional, will improve readability of the paths
        assets: true,
        entrypoints: true,
        chunks: true,
        modules: true,
      },
    }),
  ],
});
