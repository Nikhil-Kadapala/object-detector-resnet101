export default {
  targets: {
    esmodules: true,
  },
  sourceType: 'module',
  babelrc: false,
  presets: [
    ["@babel/preset-react", { "runtime": "automatic" }],
    "@babel/preset-env"
  ],
  plugins: [
    "@babel/plugin-proposal-private-property-in-object"
  ],
}