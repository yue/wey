const Account = require('../../model/account')
const MockChannel = require('./mock-channel')

let nameCount = 0

class MockAccount extends Account {
  constructor(service, config=null) {
    if (config) {
      super(service, config.id, config.name)
      return
    }

    // Mock name.
    const name = String.fromCharCode('A'.charCodeAt(0) + nameCount++)
    super(service, name, name)

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
    return {id: this.id, name: this.name}
  }

  static deserialize(service, config) {
    return new MockAccount(service, config)
  }
}

module.exports = MockAccount
