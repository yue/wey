const Signal = require('mini-signals')

class Account {
  constructor(id, name) {
    this.id = id
    this.name = name
    this.channels = {}
    this.onUpdateChannels = new Signal()
  }
}

module.exports = Account
