const path = require('path')

const Service = require('../../model/service')
const MockAccount = require('./mock-account')
const MockChannel = require('./mock-channel')

class MockService extends Service {
  constructor() {
    super('Mock Chat', MockAccount, MockChannel)
    this.path = path.basename(__dirname)
  }

  login(callback) {
    callback(null, new MockAccount(this))
  }
}

module.exports = new MockService
