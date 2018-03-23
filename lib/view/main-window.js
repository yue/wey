const gui = require('gui')

const AccountsPanel = require('./accounts-panel')
const ChannelsPanel = require('./channels-panel')
const ChatBox = require('./chat-box')

const windowManager = require('../controller/window-manager')

class MainWindow {
  constructor() {
    this.window = gui.Window.create({})
    this.contentView = gui.Container.create()
    this.contentView.setStyle({
      flexDirection: 'row',
    })
    this.window.setContentView(this.contentView)
    this.accountsPanel = new AccountsPanel(this)
    this.contentView.addChildView(this.accountsPanel.view)
    this.channelsPanel = new ChannelsPanel(this)
    this.contentView.addChildView(this.channelsPanel.view)
    this.chatBox = new ChatBox()
    this.contentView.addChildView(this.chatBox.view)

    windowManager.addWindow(this)
  }

  serialize() {
    const config = {}
    Object.assign(config, this.accountsPanel.serialize())
    return config
  }

  deserialize(config) {
    this.accountsPanel.deserialize(config)
  }
}

module.exports = MainWindow
