'use strict';

var fs = require('fs');
var path = require('path');
var git = require('nodegit');
var chalk = require('chalk');
var mkdirp = require('mkdirp');

function RepoInitializer(options) {
  options = options || {};

  if (!options.repoUrl) {
    throw new Error('RepoInitializer requires options.repoUrl');
  }

  if (!options.repoPath) {
    throw new Error('RepoInitializer requires options.repoPath');
  }

  this._repoUrl = options.repoUrl;
  this._pathToGit = options.repoPath;
  
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

RepoInitializer.prototype._credentials = function(url, username) {
  if (this._credType === 'password') {
    return git.Cred.userpassPlaintextNew(this._gitUsername, this._gitPassword);
  }
  return git.Cred.defaultNew();
};

RepoInitializer.prototype.init = function(cb) {
  fs.lstat(this._pathToGit, function(err, stats) {
    this._forceWrite = true;

    if (!err && stats.isDirectory()) {
      this._openRepo(cb);
      return;
    }

    this._cloneRepo(cb);
  }.bind(this));
};

RepoInitializer.prototype._openRepo = function(cb) {
  console.log(chalk.grey('Opening repo at ') +
              chalk.white(this._pathToGit));

  git.Repository
    .open(this._pathToGit)
    .then(cb)
    .done();
};

RepoInitializer.prototype._cloneRepo = function(cb) {
  mkdirp(this._pathToGit, function(err) {
    if (err) {
      console.log('Error during creating the directory for the repo.');
      console.log(err);
      return;
    }

    var cloneOptions = {
      bare: 1,
      checkoutBranch: 'master',
      remoteCallbacks: {
        credentials: this._credentials.bind(this)
      }
    };

    console.log(chalk.grey('Cloning repo to ') + chalk.white(this._pathToGit));

    git.Clone
      .clone(this._repoUrl, this._pathToGit, cloneOptions)
      .then(cb)
      .done();
  }.bind(this));
};

module.exports = function(options, cb) {
  var repoInit = new RepoInitializer(options);
  repoInit.init(cb);
};
