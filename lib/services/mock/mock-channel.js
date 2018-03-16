const Channel = require('../../model/channel')

function makeName() {
  let text = ''
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for (let i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  return text
}


class MockChannel extends Channel {
  constructor() {
    const name = makeName()
    super(name, name)
  }
}

module.exports = MockChannel
