const gui = require('gui')

require('./chat/chat-protocol')

class ChatBox {
  constructor() {
    this.view = gui.Browser.create({})
    this.view.setStyle({
      flex: 1,
    })
  }

  loadChannel(account, channel) {
    this.view.loadURL(`wey://chat/messages/${account.id}/${channel.id}`)
  }
}

module.exports = ChatBox
