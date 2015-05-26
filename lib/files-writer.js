'use strict';

var chalk = require('chalk');
var executeCommands = require('./exec-commands');
var saveFile = require('./save-file');
var publish = require('./publish');
var path = require('path');
var fs = require('fs');

function FilesWriter(walker, opts) {
  this._walker = walker;

  opts = opts || {};
  this._repoPath = opts.repoPath;
  this._destination = opts.destination;
}

FilesWriter.prototype.write = function(cb) {
  var entriesCount = 0;
  this._walker.on('entry', function(entry) {
    entriesCount++;
    entry.getBlob()
      .then(function(blob) {
        console.log(chalk.grey('Writing ') + chalk.white(entry.path()));
        var filePath = path.resolve(this._repoPath, entry.path());
        saveFile(filePath, blob.content());

        entriesCount--;
        if (entriesCount === 0) {
          console.log(chalk.grey('Finished updating repo'));

          var pathToPkg = path.join(this._repoPath, 'package.json');
          var pkgFile = fs.readFileSync(pathToPkg);
          var pkg = JSON.parse(pkgFile);
          var config = pkg.gizi || {};

          var source = path.join(this._repoPath, config.buildPath);
          var cmds = config.cmds || [];

          executeCommands(cmds, this._repoPath, function() {
            publish(source, this._destination, function(err) {
              if (err) {
                console.log('Error during publshing files.');
                console.log(err);
              }
              cb();
            }.bind(this));
          }.bind(this));
        }
      }.bind(this))
      .done();
  }.bind(this));
  this._walker.start();
};

module.exports = FilesWriter;
