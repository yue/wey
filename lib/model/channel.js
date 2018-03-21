const Signal = require('mini-signals')

class Channel {
  static deserialize(config) {
    throw new Error('Should be implemented by service')
  }

  constructor(id, name) {
    this.id = id
    this.name = name
    this.messages = []
    this.onMessage = new Signal()
  }

  serialize() {
    throw new Error('Should be implemented by service')
  }
}

module.exports = Channel
