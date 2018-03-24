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
    this.view.setBindingName('wey')
    this.view.addBinding('ready', this.onReady.bind(this))
  }

  async loadChannel(account, channel) {
    if (this.subscription)
      this.subscription.detach()
    this.channel = channel
    // Make sure messags are loaded before loading the view.
    await channel.readMessages()
    this.isBrowserReady = false
    this.subscription = channel.onMessage.add(this.onMessage.bind(this))
    // Start showing the messages.
    this.view.loadURL(`wey://chat/messages/${account.id}/${channel.id}`)
  }

  onMessage(message) {
    if (!this.isBrowserReady)
      this.pendingMessages.push(message)
    else
      this.view.executeJavaScript(`window.addMessage(${JSON.stringify(message)})`, () => {})
  }

  onReady() {
    this.isBrowserReady = true
    for (const m of this.pendingMessages)
      this.onMessage(m)
  }
}

module.exports = ChatBox
