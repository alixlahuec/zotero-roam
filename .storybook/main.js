module.exports = {
  "stories": ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  "addons": ["@storybook/addon-a11y", "@storybook/addon-controls", "@storybook/addon-coverage", "@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions"],
  "framework": "@storybook/react",
  core: {
    builder: "webpack5"
  },
  staticDirs: ["../public"],
};