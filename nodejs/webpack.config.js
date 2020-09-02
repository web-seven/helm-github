const path = require('path');

module.exports = {
  entry: {
      repo: './src/repo.js',
      release: './src/release.js',
  },
  mode: 'production',
  target: "node",
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
};