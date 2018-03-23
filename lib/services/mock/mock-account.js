const Account = require('../../model/account')
const MockChannel = require('./mock-channel')

let nameCount = 0

class MockAccount extends Account {
  constructor(service, config=null) {
    if (config) {
      super(service, config)
      return
    }

    // Mock name.
    const name = String.fromCharCode('A'.charCodeAt(0) + nameCount++)
    super(service, {id: name, name: name})

    // Mock channels.
    const channelsCount = Math.random() * 5
    for (let i = 0; i < channelsCount; ++i) {
      this.channels.push(new MockChannel())
    }
    setTimeout(() => {
      this.channels.push(new MockChannel())
      this.onUpdateChannels.dispatch(this.channels)
    }, 1000)
  }

  serialize() {
    return super.serialize()
  }

  static deserialize(service, config) {
    return new MockAccount(service, config)
  }
}

module.exports = MockAccount
