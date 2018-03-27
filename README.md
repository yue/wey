# Wey

Light-weight desktop Slack client, written in Node.js with native UI.

__Do not use this for work, you might miss important messages due to bugs and
missing features.__

## Screenshots

## Design principles

* Use native UI for almost everything.
* Use HTML for rendering rich messages.
* The HTML page should be static for best performance, the usage of JavaScript
  in HTML page must be minimal.
* Do not add external CSS or JavaScript libraries/frameworks to the HTML page,
  hande-write everything.
* Be careful when adding dependencies, only use third party modules that are
  small and don't have tons of dependencies.

## Resources usage

Resouces used by Wey are based on following things:

* The Node.js runtime.
* Native windows and widgets.
* HTML view used for rendering messages.
* JavaScript code for communicating with Slack.

Normally for multiple teams with heavy traffics, Wey should not have any
significant CPU usage, and RAM ussage is usually under 100MB.

## Technical stack

* [Node.js](https://nodejs.org)
* [Yue](https://github.com/yue/yue)
* [Yode](https://github.com/yue/yode)

## Contributions

Please limit the size of pull requests under 300 lines, otherwise it would be
rather hard to review the code. If you have a big feature to add, please
consider splitting it into multiple pull requests.

It is also encouraged to fork this project or even develop commercial apps based
on this project.

## Login limitations

The Slack APIs are not really friendly for third party client apps, to implement
OAuth we have to first develop a small web app, and then ask your team's admin
to manually add the app to your team.

As workaround Wey can read Slack tokens from system keychain, which are written
to by the official Slack desktop app. So to login with Wey, you need to login
with the official Slack desktop app first.

Wey can not silently read the system keychain, you will be explicitly prompted
by the system when using Wey to read Slack tokens.

Another way to login is to acquire a [token from Slack][token], which is a
deprecated feature and some teams have disabled it.

## Performance bottleneck

In Wey most time are spent on networking, and performance is usually limited by
Slack's APIs.

### Most operations are done via web API

In Slack while there is Real Time Messaging API, most common operations can only
be done via web APIs, i.e. by sending HTTPS requests, and it is really slow.

### Intilization involves multiple web API calls

To sign in and load channels, we have to send multiple requests. For example
`rtm.start` to start RTM client, `team.info` to get team information,
`users.list` to list team's users, `channels.list` and `groups.list` to list
all public and private channels, `channels.history` to read messages history.

Also the `channels.list` can not reliably give unread states of channels, we
need to call `channels.info` API for every channel to get correct unread states.

So from opening the app to finally reading the messages, there are more than 7
slow HTTPS requests involved.

### Messages do not include user information

The messages history we pulled from Slack does not include full user
information, it only has user IDs in it. So in order to render the messages we
have to pull users list first.

However certain Slack teams have more than 10k users, and it is impossible to
download all users' information and cache them. Currently in Wey we only pull
a few hundreds of users via `users.list` and cache them.

Because of this rendering messages becomes asynchronous work, whenever an
uncached user ID is encountered, we have to wait and pull user's information
before rendering the message.

### User information can only be pulled one by one

Slack does not provide an API to pull information of groups of users. You can
either try to pull all users via `users.list`, or pull users one by one via
`user.info`.

For a large team which it is impractical to cache all users, we may end up
sending tens of HTTPS requests for rendering a channel's messages.

### Some bots are not returned in `users.list`

While the `users.list` should also return bot users, it somehow does not return
certain bot users. As a result even for small teams that we can cache all the
users, we still have to spend time fetching user information when rendering
channel messages involving bots.

## License

The main source code under `lib/` are published under GPLv3, other things are
published under public domain.

[token]: https://api.slack.com/custom-integrations/legacy-tokens
