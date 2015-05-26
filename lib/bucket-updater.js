'use strict';

var fs = require('fs');
var git = require('nodegit');
var chalk = require('chalk');
var mkdirp = require('mkdirp');
var FilesWriter = require('./files-writer');

var REMOTE_NAME = 'origin';

function BucketUpdater(repo, options) {
  this._repo = repo;

  options = options || {};

  if (!options.repoPath) {
    throw new Error('git server requires options.repoPath');
  }
  if (!options.destination) {
    throw new Error('git server requires options.destination');
  }
  this._filesPath = options.repoPath;
  this._branchName = options.branchName || 'master';
  this._credType = options.credType;
  this._destination = options.destination;
  if (this._credType === 'password') {
    if (!options.gitUsername) {
      throw new Error('options.gitUsername is required for password auth');
    }
    if (!options.gitPassword) {
      throw new Error('options.gitPassword is required for password auth');
    }
    this._gitUsername = options.gitUsername;
    this._gitPassword = options.gitPassword;
  }
}

BucketUpdater.prototype.update = function(opts, cb) {
  opts = opts || {};

  this._repo.getBranchCommit(this._branchName)
    .then(function(commit) {
      this._oldSHA = commit.sha();

      this._repo.fetch(REMOTE_NAME, {
        credentials: this._credentials.bind(this)
      })
      .then(function() {
        var remoteBranchName = REMOTE_NAME + '/' + this._branchName;
        this._repo.mergeBranches(this._branchName, remoteBranchName)
          .then(function() {
            if (opts.forceWrite) {
              this._readTree(cb);
            } else {
              this._updateIfNewCommit(cb);
            }
          }.bind(this));
      }.bind(this), function(err) {
        console.log('Error during fetching');
        console.log(err);
      });
    }.bind(this))
    .done();
};

BucketUpdater.prototype._credentials = function(url, username) {
  if (this._credType === 'password') {
    return git.Cred.userpassPlaintextNew(this._gitUsername, this._gitPassword);
  }
  return git.Cred.defaultNew();
};

BucketUpdater.prototype._updateIfNewCommit = function(cb) {
  this._repo.getBranchCommit(this._branchName)
    .then(function(commit) {
      if (this._oldSHA !== commit.sha()) {
        console.log(chalk.grey('Changes detected on branch ') +
                    chalk.white(this._branchName));
        this._readTree(cb);
      } else {
        cb();
      }
    }.bind(this));
};

BucketUpdater.prototype._readTree = function(cb) {
  this._repo.getBranchCommit(this._branchName)
    .then(function(commit) {
      return commit.getTree();
    })
    .then(function(tree) {
      var walker = tree.walk();

      var writer = new FilesWriter(walker, {
        repoPath: this._filesPath,
        destination: this._destination
      });
      writer.write(cb);
    }.bind(this))
    .done();
};

module.exports = BucketUpdater;
