Gizi [![Dependency Status](https://david-dm.org/zkochan/gizi/status.svg?style=flat)](https://david-dm.org/zkochan/gizi) [![Build Status](http://img.shields.io/travis/zkochan/gizi.svg?style=flat)](https://travis-ci.org/zkochan/gizi)
=====

Gizi is a static server that autoupdates itself from a Git repository.

## How to install it?

```
$ npm install -g gizi
```

# How does it work?

Gizi listens to changes in a Git repository branch. When a new commit appears in it, it updates the files in the local file system from the remote repository. After the files are update, Gizi runs a set of commands from its config file. The commands are supposed to create the static resources for the static server and write them to the **build** folder. When the commands are executed, Gizi copies the files from the build folder to the static server. The static server is running all the time.

# How to use it?

1. Create a **.gizi.yml** configuration file in the folder where the static server will be hosted.
2. Run ``gizi serve`` in that folder.

Gizi will clone the repository specified in the config file to a subfolder called **src** and start a static server that will serve files from a subfolder called **site**.

# .gizi.yml
A config file can look like this:
``` yaml
port: 9595
ip: 0.0.0.0
source: git
url: https://gitlab.com/zkochan/gizi-sample.git
buildFolder: ./build
cmds:
  # this is required because npm has a bug
  # running install multiple times
  # http://stackoverflow.com/q/20764881/537682
  - name: rm
    args: ['-rf', 'node_modules/']
  - name: npm
    args: ['install']
  - name: gulp
```


License
========

The MIT License (MIT)
