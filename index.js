#!/usr/bin/env node
'use strict';

var program = require('commander');
var path = require('path');
var pkg = require('./package');
var fs = require('fs');
var yaml = require('js-yaml');
var gizi = require('./lib/gizi');

program
  .version(pkg.version);

program
  .command('server')
  .description('Starts a Gizi server in current directory')
  .action(function() {
    var currentPath = path.resolve(process.cwd());
    var config = yaml.safeLoad(fs.readFileSync(currentPath + '/.gizi.yml'));

    if (config.source === 'fs') {
      var projectPath = path.join(currentPath, config.path || '');
      var ip = config.ip || '0.0.0.0';
      var port = config.port || '8895';
      gizi.server(projectPath, {
        ip: ip,
        port: port
      }, function() {
        console.log('Server started');
      });
    } else if (config.source === 'git') {
      gizi.gitServer(path.join(currentPath, 'src'), {
        repoUrl: config.url,
        cmds: config.cmds
      });
      gizi.server(path.join(currentPath, '/src/release'), {
        ip: '0.0.0.0',
        port: 9595
      }, function() {
        console.log('Server started');
      });
    }
  });

program.parse(process.argv);
