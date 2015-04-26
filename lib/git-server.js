'use strict';

var fs = require('fs');
var path = require('path');
var git = require('nodegit');
var chalk = require('chalk');
var executeCommands = require('./exec-commands');
var saveFile = require('./save-file');

var REMOTE_NAME = 'origin';
var REFRESH_TIMEOUT = 10 * 1000; // every 10 seconds

function GitServer(repoPath, options) {
  this._repoPath = repoPath;
  
  options = options || {};
  
  if (!options.repoUrl) {
    throw new Error('git server requires options.repoUrl');
  }
  
  this._repoUrl = options.repoUrl;
  this._pathToGit = path.resolve(repoPath, '.git');
  this._branchName = options.branchName || 'master';
}

GitServer.prototype._startRefreshTimeout = function () {
  setTimeout(function () {
    this._forceWrite = false;
    if (this._repo) {
      this._refresh(this._repo);
    }
  }.bind(this), REFRESH_TIMEOUT);
};

GitServer.prototype.init = function () {
  fs.lstat(this._pathToGit, function (err, stats) {
    this._forceWrite = true;
    
    if (!err && stats.isDirectory()) {
      console.log(chalk.grey('Opening repo at ') +
                  chalk.white(this._pathToGit));
      git.Repository.open(this._pathToGit).then(this._refresh.bind(this));
      return;
    }
    var cloneOptions = {
      bare: 1,
      checkoutBranch: this._branchName
    };
    console.log(chalk.grey('Cloning repo to ') + chalk.white(this._pathToGit));
    git.Clone.clone(this._repoUrl, this._pathToGit, cloneOptions)
      .then(this._refresh.bind(this));
  }.bind(this));
};

GitServer.prototype._refresh = function (repo) {
  this._repo = repo;
  
  repo.getBranchCommit(this._branchName)
    .then(function (commit) {
      this._oldSHA = commit.sha();
      
      repo.fetch(REMOTE_NAME, {
        credentials: function (url, username) {
          return git.Cred.defaultNew();
        }
      })
      .then(function () {
        var remoteBranchName = REMOTE_NAME + '/' + this._branchName;
        repo.mergeBranches(this._branchName, remoteBranchName)
          .then(function () {
            if (this._forceWrite) {
              this._readTree(repo);
            } else {
              this._updateIfNewCommit(repo);
            }
          }.bind(this));
      }.bind(this), function (err) {
        console.log('Error during fetching');
        console.log(err);
      });
    }.bind(this))
    .done();
};

GitServer.prototype._updateIfNewCommit = function (repo) {
  repo.getBranchCommit(this._branchName)
    .then(function (commit) {
      if (this._oldSHA !== commit.sha()) {
        console.log(chalk.grey('Changes detected on branch ') +
                    chalk.white(this._branchName));
        this._readTree(repo);
      } else {
        this._startRefreshTimeout();
      }
    }.bind(this));
};

GitServer.prototype._readTree = function (repo) {
  var self = this;
  
  repo.getBranchCommit(this._branchName)
    .then(function (commit) {
      return commit.getTree();
    })
    .then(function (tree) {
      var walker = tree.walk();
      this._entriesCount = 0;
      walker.on('entry', this._readEntry.bind(this));
      walker.start();
    }.bind(this))
    .done();
};

GitServer.prototype._readEntry = function (entry) {
  this._entriesCount++;
  entry.getBlob()
    .then(function (blob) {
      console.log(chalk.grey('Writing ') + chalk.white(entry.path()));
      var filePath = path.resolve(this._repoPath, entry.path());
      saveFile(filePath, blob.content());
      
      this._entriesCount--;
      if (this._entriesCount === 0) {
        console.log(chalk.grey('Finished updating repo'));
        executeCommands([
          { // this is required because npm has a bug running install multiple times
            // http://stackoverflow.com/q/20764881/537682
            cmd: 'rm',
            args: ['-rf', 'node_modules/']
          },
          {
            cmd: 'npm',
            args: ['install']
          }, {
            cmd: 'gulp',
            args: ['browserify']
          }
        ], function () {
          this._startRefreshTimeout();
        }.bind(this));
      }
    }.bind(this))
    .done();
};

module.exports = function (repoPath, options) {
  var gitServer = new GitServer(repoPath, options);
  gitServer.init();
};