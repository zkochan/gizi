#!/usr/bin/env node
'use strict';

var program = require('commander');
var path = require('path');
var pkg = require('./package');
var fs = require('fs');
var yaml = require('js-yaml');
var gizi = require('./lib/gizi');

var defaultConfig = {
  sourceFolderName: './src',
  siteFolderName: './site',
  buildFolderName: './build',
  port: 9595,
  ip: '0.0.0.0',
  branch: 'master'
};

program
  .version(pkg.version);

program
  .command('serve')
  .description('Starts a Gizi server in current directory')
  .action(function() {
    var currentPath = path.resolve(process.cwd());
    var config = yaml.safeLoad(fs.readFileSync(currentPath + '/.gizi.yml'));
    var destinationPath = path.join(currentPath, defaultConfig.siteFolderName);
    var buildFolder = config.buildFolder || defaultConfig.buildFolderName;

    if (config.source === 'git') {
      gizi.gitServer(path.join(currentPath, './src'), {
        repoUrl: config.url,
        cmds: config.cmds || [],
        source: path.join(currentPath, defaultConfig.sourceFolderName, buildFolder),
        destination: destinationPath
      });
      gizi.server(destinationPath, {
        ip: config.ip || defaultConfig.ip,
        port: config.port || defaultConfig.port,
        branchName: config.branch || defaultConfig.branch
      }, function() {
        console.log('Server started');
      });
    }
  });

program.parse(process.argv);
