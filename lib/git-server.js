'use strict';

var fs = require('fs');
var path = require('path');
var git = require('nodegit');
var chalk = require('chalk');
var executeCommands = require('./exec-commands');
var saveFile = require('./save-file');
var publish = require('./publish');
var mkdirp = require('mkdirp');

var REMOTE_NAME = 'origin';
var REFRESH_TIMEOUT = 10 * 1000; // every 10 seconds

function GitServer(repoPath, options) {
  this._repoPath = repoPath;

  options = options || {};

  if (!options.repoUrl) {
    throw new Error('git server requires options.repoUrl');
  }
  if (!options.destination) {
    throw new Error('git server requires options.destination');
  }

  this._repoUrl = options.repoUrl;
  this._pathToGit = path.resolve(repoPath, '.git');
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

GitServer.prototype._startRefreshTimeout = function() {
  setTimeout(function() {
    this._forceWrite = false;
    if (this._repo) {
      this._refresh(this._repo);
    }
  }.bind(this), REFRESH_TIMEOUT);
};

GitServer.prototype.init = function() {
  fs.lstat(this._pathToGit, function(err, stats) {
    this._forceWrite = true;

    if (!err && stats.isDirectory()) {
      this._openRepo();
      return;
    }

    this._cloneRepo();
  }.bind(this));
};

GitServer.prototype._openRepo = function() {
  console.log(chalk.grey('Opening repo at ') +
              chalk.white(this._pathToGit));

  git.Repository
    .open(this._pathToGit)
    .then(this._refresh.bind(this))
    .done();
};

GitServer.prototype._cloneRepo = function() {
  mkdirp(this._pathToGit, function(err) {
    if (err) {
      console.log('Error during creating the directory for the repo.');
      console.log(err);
      return;
    }

    var cloneOptions = {
      bare: 1,
      checkoutBranch: this._branchName
    };

    console.log(chalk.grey('Cloning repo to ') + chalk.white(this._pathToGit));

    git.Clone
      .clone(this._repoUrl, this._pathToGit, cloneOptions)
      .then(this._refresh.bind(this))
      .done();
  }.bind(this));
};

GitServer.prototype._refresh = function(repo) {
  this._repo = repo;

  repo.getBranchCommit(this._branchName)
    .then(function(commit) {
      this._oldSHA = commit.sha();

      repo.fetch(REMOTE_NAME, {
        credentials: this._credentials.bind(this)
      })
      .then(function() {
        var remoteBranchName = REMOTE_NAME + '/' + this._branchName;
        repo.mergeBranches(this._branchName, remoteBranchName)
          .then(function() {
            if (this._forceWrite) {
              this._readTree(repo);
            } else {
              this._updateIfNewCommit(repo);
            }
          }.bind(this));
      }.bind(this), function(err) {
        console.log('Error during fetching');
        console.log(err);
      });
    }.bind(this))
    .done();
};

GitServer.prototype._credentials = function(url, username) {
  if (this._credType === 'password') {
    return git.Cred.userpassPlaintextNew(this._gitUsername, this._gitPassword);
  }
  return git.Cred.defaultNew();
};

GitServer.prototype._updateIfNewCommit = function(repo) {
  repo.getBranchCommit(this._branchName)
    .then(function(commit) {
      if (this._oldSHA !== commit.sha()) {
        console.log(chalk.grey('Changes detected on branch ') +
                    chalk.white(this._branchName));
        this._readTree(repo);
      } else {
        this._startRefreshTimeout();
      }
    }.bind(this));
};

GitServer.prototype._readTree = function(repo) {
  repo.getBranchCommit(this._branchName)
    .then(function(commit) {
      return commit.getTree();
    })
    .then(function(tree) {
      var walker = tree.walk();
      this._entriesCount = 0;
      walker.on('entry', this._readEntry.bind(this));
      walker.start();
    }.bind(this))
    .done();
};

GitServer.prototype._readEntry = function(entry) {
  this._entriesCount++;
  entry.getBlob()
    .then(function(blob) {
      console.log(chalk.grey('Writing ') + chalk.white(entry.path()));
      var filePath = path.resolve(this._repoPath, entry.path());
      saveFile(filePath, blob.content());

      this._entriesCount--;
      if (this._entriesCount === 0) {
        console.log(chalk.grey('Finished updating repo'));

        var pkg = require(path.join(this._repoPath, 'package.json'));
        var config = pkg.gizi || {};

        var source = path.join(this._repoPath, config.buildPath);
        var cmds = config.cmds || [];

        executeCommands(cmds, function() {
          publish(source, this._destination, function(err) {
            if (err) {
              console.log('Error during publshing files.');
              console.log(err);
            }
            this._startRefreshTimeout();
          }.bind(this));
        }.bind(this));
      }
    }.bind(this))
    .done();
};

module.exports = function(repoPath, options) {
  var gitServer = new GitServer(repoPath, options);
  gitServer.init();
};
