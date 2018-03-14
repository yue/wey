const Service = require('../../model/service')
const MockAccount = require('./mock-account')

class MockService extends Service {
  constructor() {
    super('Mock Chat')
  }

  login(callback) {
    callback(null, new MockAccount())
  }
}

module.exports = new MockService
