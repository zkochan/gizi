Gizi [![Dependency Status](https://david-dm.org/zkochan/gizi/status.svg?style=flat)](https://david-dm.org/zkochan/gizi) [![Build Status](https://travis-ci.org/zkochan/gizi.svg?branch=master)](https://travis-ci.org/zkochan/gizi) [![npm version](https://badge.fury.io/js/gizi.svg)](http://badge.fury.io/js/gizi)
=====

Gizi is a static server that autoupdates itself from a Git repository.

## How to install it?

```
$ npm install -g gizi
```

# How does it work?

The static server is running from the moment when the **gizi serve** command is executed in the console. The files that are served are in the **site** directory.

At startup, Gizi clones the repository specified in **.gizi.yml** to the **src** subfolder. When all the repo files are created, Gizi runs a set of commands that are specified in the downloaded project's package.json. The commands are supposed to create the resources for the static server and write them to the build folder. The build folder name is also specified in package.json. When all the commands are executed, Gizi copies the files from the build folder to the static server.

Next, Gizi listens to changes in the Git repository. When a new commit appears in the branch which it listens to, Gizi updates the files in the local file system from the remote repository, executes the commands and updates the files on the server.

# How to configure it?

1. Create a **.gizi.yml** configuration file in the folder where the static server will be hosted.
2. Run ``gizi serve`` in that folder.

Gizi will clone the repositories specified in the config file to a subfolder called **src** and start a static server that will serve files from a subfolder called **site**.

A .gizi.yml config file can look like this:
``` yaml
port: 9595
ip: 0.0.0.0
sources:
  - name: gizi-sample
    gitUrl: https://gitlab.com/zkochan/gizi-sample.git
buckets:
  - name: sample
    source: gizi-sample
    branch: master
  - name: lala
    source: gizi-sample
    branch: lala
```

The Git project's package.json has to contain a section with Gizi configs. E.g.:

``` json
"gizi": {
  "buildPath": "./_build",
  "cmds": {
    "sample": [
      ["rm", "-rf", "node_modules/"],
      ["npm", "install"],
      ["gulp"]
    ]
  }
}
```

License
========

The MIT License (MIT)
