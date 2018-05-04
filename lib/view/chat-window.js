const gui = require('gui')

const ChatBox = require('./chat-box')

const windowManager = require('../controller/window-manager')

class ChatWindow {
  constructor(messageList, bounds) {
    this.window = gui.Window.create({})
    this.chatBox = new ChatBox(this)
    this.window.setContentView(this.chatBox.view)
    this.window.setContentSize(bounds)

    let title = messageList.account.name
    if (messageList.type === 'channel')
      title += ` | ${messageList.name}`
    else if (messageList.type === 'thread')
      title += ` | ${messageList.channel.name} | Thread`
    this.window.setTitle(title)

    this.chatBox.loadChannel(messageList)

    windowManager.addWindow(this)
  }

  initWithConfig(config) {
    this.window.center()
    this.window.activate()
  }

  getConfig() {
    return {}
  }

  unload() {
    this.chatBox.unload()
  }
}

module.exports = ChatWindow
