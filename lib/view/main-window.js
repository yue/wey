const gui = require('gui')

const AccountsPanel = require('./accounts-panel')
const ChannelsPanel = require('./channels-panel')
const ChatBox = require('./chat-box')
const ChannelsSearcher = require('./channels-searcher')

const windowManager = require('../controller/window-manager')

class MainWindow {
  constructor() {
    this.window = gui.Window.create({})
    this.window.setTitle(require('../../package.json').productName)
    this.contentView = gui.Container.create()
    this.contentView.setStyle({flexDirection: 'row'})
    this.window.setContentView(this.contentView)
    this.accountsPanel = new AccountsPanel(this)
    this.contentView.addChildView(this.accountsPanel.view)
    this.channelsPanel = new ChannelsPanel(this)
    this.contentView.addChildView(this.channelsPanel.view)
    this.chatBox = new ChatBox(this)
    this.contentView.addChildView(this.chatBox.view)
    this.channelsSearcher = new ChannelsSearcher(this)
    this.channelsSearcher.view.setVisible(false)
    this.contentView.addChildView(this.channelsSearcher.view)

    windowManager.addWindow(this)
  }

  initWithConfig(config) {
    this.accountsPanel.initWithConfig(config)
  }

  getConfig() {
    const config = {}
    Object.assign(config, this.accountsPanel.getConfig())
    return config
  }
}

module.exports = MainWindow
