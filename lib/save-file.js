'use strict';

var fs = require('fs');
var mkdirp = require('mkdirp');
var normalize = require('normalize-path');

module.exports = function(filePath, content) {
  var normFilePath = normalize(filePath);
  mkdirp.sync(normFilePath.split('/').slice(0, -1).join('/'));
  fs.writeFileSync(normFilePath, content);
};
