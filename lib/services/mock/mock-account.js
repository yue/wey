const Account = require('../../model/account')
const MockChannel = require('./mock-channel')

let nameCount = 0

class MockAccount extends Account {
  constructor() {
    // Mock name.
    const name = String.fromCharCode('A'.charCodeAt(0) + nameCount++)
    super(name, name)

    // Mock channels.
    const channelsCount = Math.random() * 5
    for (let i = 0; i < channelsCount; ++i) {
      const channel = new MockChannel()
      this.channels[channel.id] = channel
    }
    setTimeout(() => {
      this.channels = {}
      const channelsCount = Math.random() * 5
      for (let i = 0; i < channelsCount; ++i) {
        const channel = new MockChannel()
        this.channels[channel.id] = channel
      }
      this.onUpdateChannels.dispatch(this.getChannels())
    }, 1000)
  }

  getChannels() {
    return Object.values(this.channels)
  }
}

module.exports = MockAccount
