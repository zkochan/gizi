#!/usr/bin/env node
'use strict';

var program = require('commander');
var path = require('path');
var pkg = require('./package');
var fs = require('fs');
var yaml = require('js-yaml');
var staticServer = require('./lib/static-server');
var gitListener = require('./lib/git-listener');

var defaultConfig = {
  sourceFolderName: './src',
  siteFolderName: './site',
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

    var repoPath = path.join(currentPath, defaultConfig.sourceFolderName);

    var repoOptions = config.sources.map(function(source) {
      return {
        name: source.name,
        repoUrl: source.gitUrl,
        repoPath: path.join(repoPath, './_repos/' + source.name)
      };
    });
    gitListener({
      sourceFolderName: repoPath,
      siteFolderName: destinationPath
    }, repoOptions, config.buckets);

    staticServer(destinationPath, {
      ip: config.ip || defaultConfig.ip,
      port: config.port || defaultConfig.port,
      branchName: config.branch || defaultConfig.branch
    }, function() {
      console.log('Server started');
    });
  });

program.parse(process.argv);
