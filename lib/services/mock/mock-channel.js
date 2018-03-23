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
      super(config)
      return
    }

    super({id: ++channelId, name: makeName()})
  }

  serialize() {
    return super.serialize()
  }

  static deserialize(config) {
    return new MockChannel(config)
  }
}

module.exports = MockChannel
