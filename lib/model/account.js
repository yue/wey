const Signal = require('mini-signals')

const accountManager = require('../controller/account-manager')

class Account {
  constructor(service, config) {
    this.service = service
    this.id = config.id
    this.name = config.name
    this.currentChannelId = config.currentChannelId ? config.currentChannelId
                                                    : null
    this.channels = []
    this.onRemove = new Signal()
    this.onUpdateChannels = new Signal()

    accountManager.addAccount(this)
  }

  serialize() {
    const config = { id: this.id, name: this.name }
    if (this.currentChannelId)
      Object.assign(config, { currentChannelId: this.currentChannelId })
    return config
  }

  findChannelById(id) {
    return this.channels.find((c) => c.id == id)
  }
}

module.exports = Account
