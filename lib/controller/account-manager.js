const fs = require('fs')
const path = require('path')
const Signal = require('mini-signals')

class AccountsManager {
  constructor() {
    this.servicesPath = path.resolve(__dirname, '..', 'services')
    this.accounts = []

    this.onAddAccount = new Signal()
    this.onRemoveAccount = new Signal()
  }

  serialize() {
    return this.accounts.map((account) => {
      const config = account.serialize()
      config.service = account.service.id
      return config
    })
  }

  deserialize(config) {
    for (const c of config) {
      const service = require(path.join(this.servicesPath, c.service))
      service.Account.deserialize(service, c)
    }
  }

  getServices() {
    const services = fs.readdirSync(this.servicesPath)
    return services.map((s) => require(path.join(this.servicesPath, s)))
  }

  addAccount(account) {
    this.accounts.push(account)
    this.onAddAccount.dispatch(account)
  }

  removeAccount(account) {
    account.disconnect()
    this.accounts.splice(this.accounts.indexOf(account), 1)
    this.onRemoveAccount.dispatch(account)
  }

  findAccountById(id) {
    return this.accounts.find((a) => a.id == id)
  }
}

module.exports = new AccountsManager
