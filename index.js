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
    var destinationPath = path.join(currentPath, './release');

    if (config.source === 'git') {
      gizi.gitServer(path.join(currentPath, './src'), {
        repoUrl: config.url,
        cmds: config.cmds || [],
        source: path.join(currentPath, './src', config.buildFolder || './build'),
        destination: destinationPath
      });
      gizi.server(destinationPath, {
        ip: config.ip || '0.0.0.0',
        port: config.port || 9595
      }, function() {
        console.log('Server started');
      });
    }
  });

program.parse(process.argv);
