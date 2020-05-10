# Wey

Fast open source Slack desktop app, written in Node.js with native UI powered
by [the Yue library](https://github.com/yue/yue).

Note that this project is not actively maintained, you may want to use the
fork [lounge-lizard](https://github.com/cacticouncil/lounge-lizard/) instead.

__Do not use this for work, you might miss important messages due to bugs and
missing features.__

## Screenshots

|  macOS            |    Linux          |  Windows          |
| ----------------- | ----------------- | ----------------- |
| ![][mac-screen]   | ![][linux-screen] | ![][win-screen]   |

## Releases

To find latest releases for different platforms, go to the [Releases][releases]
page on GitHub.

## Technical stack

* [Yue](https://github.com/yue/yue) - Cross-platform native UI library
* [Yode](https://github.com/yue/yode) - Node.js fork with GUI message loop
* [Yackage](https://github.com/yue/yackage) - Package Node.js project with Yode
* [Node.js](https://nodejs.org)

## Resources usage

Resources used by Wey are based on following things:

* The Node.js runtime.
* Native windows and widgets.
* HTML view used for rendering messages.
* JavaScript code for communicating with Slack.
* Cached Users and messages information in teams.

Normally for multiple teams with heavy traffics, Wey should not have any
significant CPU usage, and RAM usage is usually under 100MB. However if you
have a team with more than 10k users in it, the memory usage may increase a lot.

## Design principles

Wey is developed with following principles, the ultimate goal is to provide a
fast and powerful chat app.

### Use native UI for almost everything

Most parts of Wey should be created with native UI widgets from Yue library,
when there is need for custom UI, draw it manually.

### HTML is our friend

Webview is a great tool as long as we use it wisely. For rendering the rich
messages of Slack, HTML is the best tool.

The HTML pages showed in Wey should be static for best performance, the usage
of JavaScript in the pages must be minimal. We should not use any external CSS
or JavaScript library/framework, every style and animation must be hand written.

### Minimal dependencies

Be careful when adding dependencies, only use third party modules that are small
and without tons of dependencies.

### Hide details of chat service providers

While Wey currently only supports Slack, it is on roadmap to add support for
more services, and in future we will support plugins to add arbitrary services.

To achieve this we must ensure the views and controllers must only operate on
the public interfaces of models, all internal implementations must be hidden
from outside.

### Separated views

Wey supports multiple windows with different types for reading messages, so the
views should act only as users of models, and should not manage the models.

As benefit creating views in Wey is very fast, opening a new window is almost
as fast as showing a hidden window. Users can close all windows and run Wey in
background, while still be able to open a new window quickly.

### Correctly unload things

While JavaScript has garbage collections, it is still very easy to cause memory
leaks when careless referencing objects together. Views in Wey are reloaded
frequently (for example switching accounts and closing windows), so it is
important to ensure everything event subscription is detached when unloading
a view.

## Contributions

Please limit the size of pull requests under 300 lines, otherwise it would be
rather hard to review the code. If you have a big feature to add, please
consider splitting it into multiple pull requests.

It is also encouraged to fork this project or even develop commercial apps based
on this project, as long as you follow the GPLv3 license.

## Performance bottleneck

In Wey most time are spent on networking, especially on startup when fetching
channels information from Slack, and performance is usually limited by
Slack's APIs.

### Most operations are done via web API

In Slack while there is Real Time Messaging API, most common operations can only
be done via web APIs, i.e. by sending HTTPS requests, and it is really slow.

### Messages do not include user information

The messages history we pulled from Slack does not include full user
information, it only has user IDs in it. So in order to render the messages we
have to pull users list first.

However certain Slack teams have more than 20k users, and it is impossible to
download all users' information and cache them. Because of this rendering
messages becomes asynchronous work, whenever an uncached user ID is encountered,
we have to wait and pull user's information before rendering the message.

And for large teams we usually end up with caching more than 10k users, which
uses a huge JavaScript object, and takes lots of memory.

### Some bots are not returned in `users.list`

While the `users.list` should also return bot users, it somehow does not return
certain bot users. As a result even for small teams that we can cache all the
users, we still have to spend time fetching user information when rendering
channel messages involving bots.

## Quirks

I have met some quirks when using Slack APIs, any help would be appreciated.

* To mark a channel as read we need to send last read timestamp, but it is
  really to determine which timestamp to send. Marking certain bot messages as
  read would make Slack server think the channel is unread.

## License

The main source code under `lib/` are published under GPLv3, other things are
published under public domain.

[releases]: https://github.com/yue/wey/releases
[token]: https://api.slack.com/custom-integrations/legacy-tokens
[mac-screen]: https://user-images.githubusercontent.com/639601/38463114-178afd9e-3b2e-11e8-9650-09b5d981523b.png
[linux-screen]: https://user-images.githubusercontent.com/639601/38463115-17b8c7e2-3b2e-11e8-8f75-5a76f87686f3.png
[win-screen]: https://user-images.githubusercontent.com/639601/38463105-97644cc4-3b2d-11e8-97a1-6cdb451ae3a8.png
