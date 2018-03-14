const Account = require('../../model/account')

class MockAccount extends Account {
  constructor() {
    super('M')
  }
}

module.exports = MockAccount
