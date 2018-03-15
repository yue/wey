const Signal = require('mini-signals')

class Account {
  constructor(name) {
    this.name = name
    this.channels = []
    this.onUpdateChannels = new Signal()
  }
}

module.exports = Account
