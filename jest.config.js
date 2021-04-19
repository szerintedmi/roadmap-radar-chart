/* Setup with jsdom but replace jsdom with svgdom in setupFilesAfterEnv so we can test svg */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["./src/jest.svgDom.ts"],
};
