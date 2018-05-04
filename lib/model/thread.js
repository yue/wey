const MessageList = require('./message-list')

class Thread extends MessageList {
  constructor(channel, id) {
    super(channel.account)
    this.channel = channel
    this.id = id

    this.channel.openedThreads.push(this)
  }

  unload() {
    const i = this.channel.openedThreads.indexOf(this)
    if (i === -1) {
      console.error('Removing orphan thread', this.id)
      return
    }
    this.channel.openedThreads.splice(i, 1)
    super.unload()
  }
}

module.exports = Thread
