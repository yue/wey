const Signal = require('mini-signals')

class Channel {
  constructor(id, name) {
    this.id = id
    this.name = name
    this.isMember = false
    this.isPrivate = false
    this.messages = []
    this.onMessage = new Signal()
  }

  foldMessages(messages) {
    for (const i in messages) {
      if (i == 0)
        continue
      const m = messages[i]
      const pm = messages[i - 1]
      if (m.user.id == pm.user.id &&
          m.date.getTime() - pm.date.getTime() < 5 * 60 * 1000)
        m.isFolded = true
    }
    return messages
  }

  async dispatchMessage(message) {
    // TODO Limit the size of messages.
    // TODO Handle edit and delete messages.
    if (this.messages.length > 0) {
      const pm = this.messages[this.messages.length - 1]
      if (message.user.id == pm.user.id &&
          message.date.getTime() - pm.date.getTime() < 5 * 60 * 1000)
        message.isFolded = true
    }
    this.messages.push(message)
    this.onMessage.dispatch(message)
  }

  async readMessages() {
    throw new Error('Should be implemented by subclasses')
  }
}

module.exports = Channel
