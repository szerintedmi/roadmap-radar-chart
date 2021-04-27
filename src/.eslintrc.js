module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["plugin:@typescript-eslint/recommended"],
  rules: {
    "max-len": "off",
    "@typescript-eslint/no-unused-vars": "warn",
    "no-unused-vars": "off", // eslint gives duplicated warning, use only @typescript-eslint
    // TODO: fix these and switch them back:
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
};
