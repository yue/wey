const Signal = require('mini-signals')

const accountManager = require('../controller/account-manager')

class Account {
  constructor(service, config) {
    this.service = service
    this.id = config.id
    this.name = config.name
    this.currentChannelId = config.currentChannelId ? config.currentChannelId : null
    this.icon = config.icon ? config.icon : null
    this.channels = []
    this.currentUserId = null
    this.users = {}

    this.onUpdateChannels = new Signal()
    this.onUpdateInfo = new Signal()

    accountManager.addAccount(this)
  }

  serialize() {
    const config = { id: this.id, name: this.name }
    if (this.currentChannelId)
      Object.assign(config, { currentChannelId: this.currentChannelId })
    if (this.icon)
      Object.assign(config, { icon: this.icon })
    return config
  }

  findChannelById(id) {
    return this.channels.find((c) => c.id == id)
  }

  disconnect() {
    throw new Error('Should be implemented by subclass')
  }
}

module.exports = Account
