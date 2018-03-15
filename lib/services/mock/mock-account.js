const Account = require('../../model/account')
const MockChannel = require('./mock-channel')

let nameCount = 0

class MockAccount extends Account {
  constructor() {
    super(String.fromCharCode('A'.charCodeAt(0) + nameCount++))

    const channelsCount = Math.random() * 5
    for (let i = 0; i < channelsCount; ++i)
      this.channels.push(new MockChannel())
  }
}

module.exports = MockAccount
