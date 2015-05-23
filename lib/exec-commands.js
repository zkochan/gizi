'use strict';

var path = require('path');
var chalk = require('chalk');
var spawn = require('cross-spawn');

function executeCommand(cmd, args, cb) {
  console.log(chalk.yellow('Executing: ') + cmd + ' ' + args.join(' '));

  var child = spawn(cmd, args, {
    cwd: path.join(path.resolve(process.cwd()), '/src')
  });
  var result = '';

  child.stdout.on('data', function(buffer) {
    console.log(chalk.grey(buffer.toString()));
    result += buffer.toString();
  });
  
  child.stderr.on('data', function(buffer) {
    console.log(chalk.red(buffer.toString()));
  });

  child.stdout.on('end', function() {
    cb(result);
  });
}

function exec(cmds, cb) {
  if (cmds && cmds.length) {
    var cmd = cmds.shift();
    executeCommand(cmd.cmd, cmd.args, function() {
      console.log(chalk.yellow('Finished: ') + cmd.cmd + ' ' + cmd.args.join(' '));
      exec(cmds, cb);
    });
  } else {
    console.log(chalk.cyan('Finished executing the commands'));
    cb();
  }
}

module.exports = exec;
