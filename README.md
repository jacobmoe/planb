# planb

API developers are the worst. They break things when you're in the middle of adding a sweet feature to the client application.

You could add fixture data, but during development it's likely to go stale, and you still have to serve it.

planb makes it easy to fetch fresh API data when the API is up and serve it when it's down.

## Install

```bash
$ npm install -g planb
```

## Usage

```bash
$ cd /path/to/project

$ planb init

Project initialized

$ planb add "http://reddit.com/r/node.json"

endpoint added

$ planb add "http://reddit.com/r/node.json" -p 5001

endpoint added

$ planb fetch

Updating reddit.com/r/node.json for port 5000
Updating reddit.com/r/node.json for port 5001

$ planb list

.---------------------------------------------.
|   | 5000 | get | reddit.com/r/node.json     |
|---|-----------------------------------------|
| 0 | Wed Jun 10 2015 22:26:41 GMT-0400 (EDT) |
'---------------------------------------------'

.---------------------------------------------.
|   | 5001 | get | reddit.com/r/node.json     |
|---|-----------------------------------------|
| 0 | Wed Jun 10 2015 22:26:41 GMT-0400 (EDT) |
'---------------------------------------------'

$ planb serve

Listening on port 5000
Listening on port 5001

$ planb

  Usage: index [options] [command]


  Commands:

    init                       Initialize a project in current directory
    add [url]                  Add a new endpoint
    list                       List all endpoint versions
    fetch                      Fetch and store a new version for each endpoint
    rollback [endpoint]        Rollback the endpoint's current version
    remove [endpoint]          Remove the endpoint and all its versions
    diff [endpoint] [v1] [v2]  Diff versions. With no version numbers,
                               diffs the current version with the previous
    serve                      Serve local versions

  Options:

    -h, --help             output usage information
    -p, --port <port>      Set port. Default: 5000
    -a, --action <action>  Set action. Default: get
```

After `planb serve`, swap references to the API domain with `localhost:5000`. In the above example, data will be available at `localhost:5000/r/node.json` and `localhost:5001/r/node.json`.

## Config

A project is initialized if a `.planb.json` file is found in the current directory, or a parent directory all the way up to `/`. Running `planb init` will create a `.planb.json` config file and a `.planb.d` data directory. The config created from the above example would look like:

```json
{
  "endpoints": {
    "5000": {
      "get": [
        "reddit.com/r/node.json"
      ],
      "default": true
    },
    "5001": {
      "get": [
        "reddit.com/r/node.json"
      ]
    }
  }
}
```

You can add endpoints directly to the config and run `planb fetch`, skipping `planb add ...`. If the data directory isn't present but the config is, `planb fetch` will create it.

## Notes
- Exact query strings must be used. Order matters. So, `example.com/api?type=test&other=param` will not be the same endpoint as `example.com/api?other=param&type=test`

## Tests

```bash
$ npm test
```
