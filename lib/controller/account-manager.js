const fs = require('fs')
const path = require('path')
const Signal = require('mini-signals')

class AccountsManager {
  constructor() {
    this.servicesPath = path.resolve(__dirname, '..', 'service')
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
      service.deserializeAccount(c)
    }
  }

  getServices() {
    const services = fs.readdirSync(this.servicesPath)
    return services.map((s) => require(path.join(this.servicesPath, s)))
  }

  addAccount(account) {
    // When adding duplicate account, just focus on it.
    const a = this.findAccountById(account.id)
    if (a) {
      const win = require('./window-manager').getCurrentWindow()
      if (win && win.selectAccount)
        win.selectAccount(a)
      return
    }

    this.onAddAccount.dispatch(account)
    this.accounts.push(account)
  }

  removeAccount(account) {
    this.onRemoveAccount.dispatch(account)
    this.accounts.splice(this.accounts.indexOf(account), 1)
    account.disconnect()
  }

  findAccountById(id) {
    return this.accounts.find((a) => a.id == id)
  }
}

module.exports = new AccountsManager
