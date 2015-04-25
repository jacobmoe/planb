# planb

API developers are the worst. They break things when you're in the middle of adding a sweet feature to the client application.

![](http://38.media.tumblr.com/37bb6ffb18c4381bdd0cf2d41a4d0354/tumblr_inline_nky4hdG6Up1rhbuv5.gif)

You could add fixture data, but during development it's likely to go stale, and you still have to serve it.

Planb is makes it easy to fetch fresh API data when the API is up and serve it when it's down.

## Install

``` bash
$ npm install -g planb

```

## Usage

``` bash

$ planb add http://reddit.com/r/node.json

$ planb fetch

$ planb list

$ planb serve

```