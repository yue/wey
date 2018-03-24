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

  async dispatchMessage(message) {
    // TODO Limit the size of messages.
    this.messages.push(message)
    this.onMessage.dispatch(message)
  }

  async readMessages() {
    throw new Error('Should be implemented by subclasses')
  }
}

module.exports = Channel
