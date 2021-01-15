'use strict';

const path = require('path');

module.exports = config;

var config = {
  entry: path.join(__dirname, 'src', 'index.js'),
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'build.js',
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
};

module.exports = config;
