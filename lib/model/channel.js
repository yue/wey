const Signal = require('mini-signals')

class Channel {
  constructor(name) {
    this.name = name
    this.onMessage = new Signal()
  }
}

module.exports = Channel
