const Service = require('../../model/service')
const MockAccount = require('./mock-account')

class MockService extends Service {
  constructor() {
    super('Mock Chat')
    this.accounts = {}
  }

  login(callback) {
    const account = new MockAccount()
    this.accounts[account.id] = account
    callback(null, account)
  }
}

module.exports = new MockService
