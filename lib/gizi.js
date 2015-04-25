'use strict';

var http = require('http');
var connect = require('connect');
var serveStatic = require('serve-static');

exports.server = function (path, options, cb) {
  var app = connect();
  app.use(serveStatic(path));
  http.createServer(app).listen(options.port, options.ip, cb);
};