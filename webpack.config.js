const path = require('path');

const browserGlobalConfig = {
  mode: 'production',
  entry: './src/browserglobal.js',
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'openspace-api.js'
  },
  module: {
    rules: [
      {
        loader: 'babel-loader',
        options: {
          presets: ["@babel/preset-env"]
        }
      }
    ]
  }
};

module.exports = browserGlobalConfig;