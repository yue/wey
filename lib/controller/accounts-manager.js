const fs = require('fs')
const path = require('path')

class AccountsManager {
  constructor() {
    this.accounts = []
  }

  serialize() {
    return this.accounts.map((account) => {
      const config = account.serialize()
      config.channels = account.channels.map((channel) => channel.serialize())
      return config
    })
  }

  deserialize(config) {
  }

  getServices() {
    const servicesPath = path.resolve(__dirname, '..', 'services')
    const services = fs.readdirSync(servicesPath)
    return services.map((s) => {
      return require(path.join(servicesPath, s))
    })
  }

  addAccount(account) {
    this.accounts.push(account)
  }
}

module.exports = new AccountsManager
