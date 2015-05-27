'use strict';

var fs = require('fs');
var git = require('nodegit');
var chalk = require('chalk');
var mkdirp = require('mkdirp');
var FilesWriter = require('./files-writer');

var REMOTE_NAME = 'origin';

function BucketUpdater(repo, options) {
  this._repo = repo;
  this._prevCommitSHA = null;

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

  this._repo.fetchAll({
      credentials: this._credentials.bind(this)
    })
    .then(function() {
      var rmBranch = REMOTE_NAME + '/' + this._branchName;
      git.Branch.lookup(this._repo, rmBranch, git.Branch.BRANCH.REMOTE)
        .then(function(ref) {
          this._repo.getBranchCommit(ref)
            .then(function(commit) {
              if (this._prevCommitSHA !== commit.sha() || opts.forceWrite) {
                if (this._prevCommitSHA) {
                  console.log(chalk.grey('Changes detected on branch ') +
                    chalk.white(this._branchName));
                }
                this._prevCommitSHA = commit.sha();
                this._readTree(commit, cb);
                return;
              }
              cb();
            }.bind(this))
            .done();
        }.bind(this))
        .done();
    }.bind(this))
    .done();
};

BucketUpdater.prototype._credentials = function(url, username) {
  if (this._credType === 'password') {
    return git.Cred.userpassPlaintextNew(this._gitUsername, this._gitPassword);
  }
  return git.Cred.defaultNew();
};

BucketUpdater.prototype._readTree = function(commit, cb) {
  commit.getTree()
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
