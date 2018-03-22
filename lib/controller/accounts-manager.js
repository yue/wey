const fs = require('fs')
const path = require('path')

class AccountsManager {
  constructor() {
    this.servicesPath = path.resolve(__dirname, '..', 'services')
    this.accounts = []
  }

  serialize() {
    return this.accounts.map((account) => {
      const config = account.serialize()
      config.service = account.service.path
      config.channels = account.channels.map((channel) => channel.serialize())
      return config
    })
  }

  deserialize(config) {
    for (const c of config) {
      const service = require(path.join(this.servicesPath, c.service))
      const account = service.Account.deserialize(service, c)
      account.channels = c.channels.map((ch) => service.Channel.deserialize(ch))
    }
  }

  getServices() {
    const services = fs.readdirSync(this.servicesPath)
    return services.map((s) => require(path.join(this.servicesPath, s)))
  }

  addAccount(account) {
    this.accounts.push(account)
  }

  removeAccount(account) {
    account.onRemove.dispatch(account)
    this.accounts.splice(this.accounts.indexOf(account), 1)
  }
}

module.exports = new AccountsManager
