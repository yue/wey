const Channel = require('../../model/channel')

let channelId = 0

function makeName() {
  let text = ''
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for (let i = 0; i < Math.random() * 5 + 3; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  return text
}

class MockChannel extends Channel {
  constructor(config=null) {
    if (config) {
      super(config.id, config.name)
      return
    }

    super(++channelId, makeName())
  }

  serialize() {
    return {id: this.id, name: this.name}
  }

  static deserialize(config) {
    return new MockChannel(config)
  }
}

module.exports = MockChannel
