'use strict';

var fs = require('fs');
var path = require('path');
var git = require('nodegit');

var REMOTE_NAME = 'origin';
var BRANCH_NAME = 'master';

function GitServer(repoPath, options) {
  this._repoPath = repoPath;
  
  options = options || {};
  
  if (!options.repoUrl) {
    throw new Error('git server requires options.repoUrl');
  }
  
  this._repoUrl = options.repoUrl;
  this._pathToGit = path.resolve(repoPath, '.git');
}

GitServer.prototype.init = function () {
  fs.lstat(this._pathToGit, function (err, stats) {
    if (!err && stats.isDirectory()) {
      git.Repository.open(this._pathToGit).then(this._refresh.bind(this));
      return;
    }
    var cloneOptions = {
      bare: 1,
      checkoutBranch: BRANCH_NAME
    };
    git.Clone.clone(this._repoUrl, this._pathToGit, cloneOptions)
      .then(this._refresh.bind(this));
  }.bind(this));
};

GitServer.prototype._refresh = function (repo) {
  repo.fetch(REMOTE_NAME, {
      credentials: function (url, username) {
        return git.Cred.defaultNew();
      }
    })
    .then(function () {
      repo.mergeBranches(BRANCH_NAME, REMOTE_NAME + '/' + BRANCH_NAME)
        .then(function () {
          this._readTree(repo);
        }.bind(this));
    }.bind(this), function (err) {
      console.log('Error during fetching');
      console.log(err);
    });
};

GitServer.prototype._readTree = function (repo) {
  repo.getBranchCommit(BRANCH_NAME)
    .then(function (commit) {
      return commit.getTree();
    })
    .then(function (tree) {
      var walker = tree.walk();
      walker.on('entry', this._readEntry.bind(this));
      walker.start();
    }.bind(this))
    .done();
};

GitServer.prototype._readEntry = function (entry) {
  entry.getBlob()
    .then(function (blob) {
      var filePath = path.resolve(this._repoPath, entry.filename());
      fs.writeFileSync(filePath, blob.content());
      
      console.log(entry.filename(), entry.sha(), blob.rawsize() + 'b');
      console.log('==================================================\n\n');
      var firstTenLines = blob.toString().split('\n').slice(0, 10).join('\n');
      console.log(firstTenLines);
      console.log('...');
    }.bind(this))
    .done();
};

module.exports = function (repoPath, options) {
  var gitServer = new GitServer(repoPath, options);
  gitServer.init();
};