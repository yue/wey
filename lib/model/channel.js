const Signal = require('mini-signals')

class Channel {
  constructor(config) {
    this.id = config.id
    this.name = config.name

    this.messages = []
    this.onMessage = new Signal()
  }

  serialize() {
    return {id: this.id, name: this.name}
  }
}

module.exports = Channel
