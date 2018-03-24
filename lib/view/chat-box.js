const gui = require('gui')

require('./chat/chat-protocol')

class ChatBox {
  constructor() {
    this.channel = null
    this.subscription = null
    this.isBrowserReady = false
    this.pendingMessages = []

    this.view = gui.Browser.create({})
    this.view.setStyle({
      flex: 1,
    })
  }

  async loadChannel(account, channel) {
    if (this.subscription)
      this.subscription.detach()
    this.channel = channel
    this.subscription = channel.onMessage.add(this.onMessage.bind(this))
    // Make sure messags are loaded before loading the view.
    await channel.readMessages()
    this.view.loadURL(`wey://chat/messages/${account.id}/${channel.id}`)
  }

  async onMessage(message) {
    if (!this.isBrowserReady)
      this.pendingMessages.push(message)
    else
      console.log('onMessage', message)
  }
}

module.exports = ChatBox
