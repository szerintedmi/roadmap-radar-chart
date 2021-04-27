/* Setup with jsdom but replace jsdom with svgdom in setupFilesAfterEnv so we can test svg */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["./src/jest.svgDom.ts"],
  testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],
  resolver: "ts-jest-resolver", // https://github.com/kulshekhar/ts-jest/issues/1057
};
