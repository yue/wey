const Signal = require('mini-signals')

const accountsManager = require('../controller/accounts-manager')

class Account {
  constructor(service, id, name) {
    this.service = service
    this.id = id
    this.name = name
    this.channels = []
    this.onUpdateChannels = new Signal()

    accountsManager.addAccount(this)
  }

  serialize() {
    throw new Error('Should be implemented by service')
  }
}

module.exports = Account
