'use strict';

var fs = require('fs');
var mkdirp = require('mkdirp');

module.exports = function (filePath, content) {
  mkdirp.sync(filePath.split('/').slice(0, -1).join('/'));
  fs.writeFileSync(filePath, content);
};