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
  constructor() {
    const name = makeName()
    super(++channelId, name)
  }

  serialize() {
    return {id: this.id, name: this.name}
  }
}

module.exports = MockChannel
