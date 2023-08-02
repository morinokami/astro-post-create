export const eslintrc = `module.exports = {
  env: {
    node: true,
    es2023: true,
    browser: true,
  },
  extends: ["eslint:recommended", "plugin:astro/recommended"],
  overrides: [
    {
      files: ["*.astro"],
      parser: "astro-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      },
      rules: {},
    },
  ],
};`;
export const eslintrcjs = `module.exports = {
  env: {
    node: true,
    es2023: true,
    browser: true,
  },
  extends: ["eslint:recommended", "plugin:astro/recommended"],
  overrides: [
    {
      files: ["*.astro"],
      parser: "astro-eslint-parser",
      rules: {},
    },
  ],
};`;
export const eslintignore = `node_modules
dist`;
export const prettierrc = `{}`;
export const prettierignore = `node_modules
dist`;
