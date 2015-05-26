'use strict';

var initRepo = require('./init-repo');
var BucketUpdater = require('./bucket-updater');
var path = require('path');
var async = require('async');

function Refresher(bucketUpdaters, opts) {
  this._bucketUpdaters = bucketUpdaters;

  opts = opts || {};
  this._refreshTimeout = opts.refreshTimeout || 10 * 1000; // 10 sec
}

Refresher.prototype.refresh = function(opts, cb) {
  async.eachSeries(this._bucketUpdaters, function(bucketUpdater, cb) {
    bucketUpdater.update(opts, cb);
  }, cb);
};

Refresher.prototype.start = function() {
  setTimeout(function() {
    this.refresh({
      forceWrite: false
    }, this.start.bind(this));
  }.bind(this), this._refreshTimeout);
};

module.exports = function(opts, repoOpts, buckets) {
  var repos = {};

  async.eachSeries(repoOpts, function(opt, cb) {
    initRepo(opt, function(repo) {
      repos[opt.name] = repo;
      cb();
    });
  }, function() {
    var bucketUpdaters = buckets.map(function(bucket) {
      var repo = repos[bucket.source];
      var bucketUpdater = new BucketUpdater(repo, {
        branchName: bucket.branch,
        repoPath: path.join(opts.sourceFolderName, bucket.source),
        destination: path.join(opts.siteFolderName, bucket.name)
      });
      return bucketUpdater;
    });

    var refresher = new Refresher(bucketUpdaters);
    refresher.refresh({
      forceWrite: true
    }, function() {
      refresher.start();
    });
  });
};
