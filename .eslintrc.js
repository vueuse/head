module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: '@antfu/eslint-config',
  rules: {
    'vue/one-component-per-file': 'off'
  },
}
