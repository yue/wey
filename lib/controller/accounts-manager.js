const fs = require('fs')
const path = require('path')

const Account = require('../model/account')

class AccountsManager {
  constructor() {
    this.accounts = []
  }

  getServices() {
    const servicesPath = path.resolve(__dirname, '..', 'services')
    const services = fs.readdirSync(servicesPath)
    return services.map((s) => {
      return require(path.join(servicesPath, s))
    })
  }
}

module.exports = AccountsManager
