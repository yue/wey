const EventEmitter = require('events')

class Account extends EventEmitter {
  constructor(name) {
    super()
    this.name = name
    this.channels = []
  }
}

module.exports = Account
