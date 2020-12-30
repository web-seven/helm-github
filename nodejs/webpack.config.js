const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
      repo: './src/repo.js',
      release: './src/release.js',
      "helm-github": './src/helm-github.js',
  },
  mode: 'production',
  target: "node",
  output: {
    filename: 'src/[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'bin', to: 'bin' },
        { from: '../plugin.yaml', to: 'plugin.yaml' },
        { from: '../LICENSE', to: '' },
        { from: '../README.md', to: '' },
      ],
    }),
  ],
};