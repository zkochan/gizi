Gizi [![Dependency Status](https://david-dm.org/zkochan/gizi/status.svg?style=flat)](https://david-dm.org/zkochan/gizi) [![Build Status](http://img.shields.io/travis/zkochan/gizi.svg?style=flat)](https://travis-ci.org/zkochan/gizi)
=====

Gizi is a static server that autoupdates itself from a Git repository.

## How to install it?

```
$ npm install -g gizi
```

# How does it work?

Gizi listens to changes in a Git repository branch. When a new commit appears in it, it updates the files in the local file system from the remote repository. After the files are update, Gizi runs a set of commands from its config file.

# How to use it?

Create a **.gizi.yml** configuration file in the root folder of the static server.

License
========

The MIT License (MIT)
