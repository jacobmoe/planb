# planb

API developers are the worst. They break things when you're in the middle of adding a sweet feature to the client application.

![](http://38.media.tumblr.com/37bb6ffb18c4381bdd0cf2d41a4d0354/tumblr_inline_nky4hdG6Up1rhbuv5.gif)

You could add fixture data, but during development it's likely to go stale, and you still have to serve it.

planb makes it easy to fetch fresh API data when the API is up and serve it when it's down.

## Install

``` bash
$ npm install -g planb
```

## Usage

``` bash
$ planb add http://reddit.com/r/node.json

$ planb fetch

$ planb list

.---------------------------------------------.
|   |       www.reddit.com/r/node.json        |
|---|-----------------------------------------|
| 0 | Sat Apr 25 2015 10:52:48 GMT-0400 (EDT) |
'---------------------------------------------'

$ planb serve

Listening on port 5555

$ planb

  Usage: index [options] [command]


  Commands:

    add [url]            Add a new endpoint
    list                 List all endpoint versions
    fetch                Fetch and store a new version for each endpoint
    rollback [endpoint]  Rollback the endpoint's current version
    remove [endpoint]    Remove the endpoint and all its versions
    serve                Serve local versions

  Options:

    -h, --help  output usage information
```

After running `planb serve`, swap any reference to the API domain (in the above example, `reddit.com`) with `localhost:5555`.