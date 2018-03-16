const Signal = require('mini-signals')

class Channel {
  constructor(id, name) {
    this.id = id
    this.name = name
    this.messages = []
    this.onMessage = new Signal()
  }
}

module.exports = Channel
