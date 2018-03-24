const gui = require('gui')

require('./chat/chat-protocol')

class ChatBox {
  constructor() {
    this.channel = null
    this.subscription = null

    this.view = gui.Browser.create({})
    this.view.setStyle({
      flex: 1,
    })
  }

  loadChannel(account, channel) {
    if (this.subscription)
      this.subscription.detach()
    this.channel = channel
    this.subscription = channel.onMessage.add(this.onMessage.bind(this))
    this.view.loadURL(`wey://chat/messages/${account.id}/${channel.id}`)
  }

  onMessage(message) {
    console.log('onMessage', message)
  }
}

module.exports = ChatBox
