'use strict';

function executeCommand(cmd, args, cb) {
    var spawn = require('child_process').spawn;
    var child = spawn(cmd, args, {
      cwd: '/home/zkochan/src/gtm/gitserver/src'//'/src'
    });
    var result = '';

    child.stdout.on('data', function(buffer) {
        result += buffer.toString();
    });

    child.stdout.on('end', function() {
        cb(result);
    });
}

function exec(cmds, cb) {
  if (cmds && cmds.length) {
    var cmd = cmds.shift();
    executeCommand(cmd.cmd, cmd.args, function () {
      console.log(cmd.cmd + ' executed');
      exec(cmds, cb);
    });
  } else {
    cb();
  }
}

module.exports = exec;