'use strict';

var fs = require('fs');
var git = require('nodegit');
var chalk = require('chalk');
var mkdirp = require('mkdirp');
var FilesWriter = require('./files-writer');

var REMOTE_NAME = 'origin';

function BucketUpdater(repo, opts) {
  this._repo = repo;
  this._prevCommitSHA = null;

  opts = opts || {};
  
  if (!opts.bucket) {
    throw new Error('git server requires opts.bucket');
  }
  if (!opts.bucket.source) {
    throw new Error('git server requires opts.bucket.source');
  }
  if (!opts.bucket.name) {
    throw new Error('git server requires opts.bucket.name');
  }
  if (!opts.sourceFolderName) {
    throw new Error('git server requires opts.sourceFolderName');
  }
  if (!opts.destination) {
    throw new Error('git server requires opts.destination');
  }
  
  this._bucketName = opts.bucket.name;
  this._filesPath = path.join(opts.sourceFolderName, opts.bucket.source);
  this._branchName = opts.bucket.branch || 'master';
  this._credType = opts.credType;
  this._destination = path.join(opts.siteFolderName, opts.bucket.name);
  if (this._credType === 'password') {
    if (!opts.gitUsername) {
      throw new Error('opts.gitUsername is required for password auth');
    }
    if (!opts.gitPassword) {
      throw new Error('opts.gitPassword is required for password auth');
    }
    this._gitUsername = opts.gitUsername;
    this._gitPassword = opts.gitPassword;
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
        destination: this._destination,
        bucketName: this._bucketName
      });
      writer.write(cb);
    }.bind(this))
    .done();
};

module.exports = BucketUpdater;
