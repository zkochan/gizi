'use strict';

var ncp = require('ncp').ncp;
var rimraf = require('rimraf');

function publish(source, destination, cb) {
  rimraf(destination, function(err) {
    if (err) {
      return cb(err);
    }

    ncp(source, destination, function(err) {
      if (err) {
        return cb(err);
      }

      rimraf(source, cb);
    });
  });
}

module.exports = publish;
