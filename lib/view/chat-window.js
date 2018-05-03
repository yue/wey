const gui = require('gui')

const ChatBox = require('./chat-box')

const windowManager = require('../controller/window-manager')

class ChatWindow {
  constructor(channel, threadId, bounds) {
    this.window = gui.Window.create({})
    let title = `${channel.account.name} | ${channel.name}`
    if (threadId)
      title += ' | Thread'
    this.window.setTitle(title)
    this.chatBox = new ChatBox(this)
    this.window.setContentView(this.chatBox.view)
    this.window.setContentSize(bounds)

    this.chatBox.loadChannel(channel, threadId)

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
