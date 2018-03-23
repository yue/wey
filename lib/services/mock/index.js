const Service = require('../../model/service')
const MockAccount = require('./mock-account')
const MockChannel = require('./mock-channel')

class MockService extends Service {
  constructor() {
    super('mock', 'Mock Chat', MockAccount, MockChannel)
  }

  login(callback) {
    callback(null, new MockAccount(this))
  }
}

module.exports = new MockService
