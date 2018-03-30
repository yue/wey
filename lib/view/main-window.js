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
    const contentView = gui.Container.create()
    contentView.setStyle({flexDirection: 'row'})
    this.window.setContentView(contentView)
    this.accountsPanel = new AccountsPanel(this)
    contentView.addChildView(this.accountsPanel.view)
    this.channelsPanel = new ChannelsPanel(this)
    contentView.addChildView(this.channelsPanel.view)
    this.chatBox = new ChatBox(this)
    contentView.addChildView(this.chatBox.view)
    this.channelsSearcher = new ChannelsSearcher(this)
    this.channelsSearcher.view.setVisible(false)
    contentView.addChildView(this.channelsSearcher.view)

    windowManager.addWindow(this)
  }

  initWithConfig(config) {
    this.accountsPanel.initWithConfig(config)

    this.window.setContentSize({width: 850, height: 600})
    this.window.center()
    this.window.activate()
  }

  getConfig() {
    const config = {}
    Object.assign(config, this.accountsPanel.getConfig())
    return config
  }

  unload() {
    this.accountsPanel.unload()
    this.channelsPanel.unload()
    this.chatBox.unload()
    this.channelsSearcher.unload()
  }

  setLoading() {
    this.channelsSearcher.view.setVisible(false)
    this.chatBox.view.setVisible(true)
    this.chatBox.setLoading()
  }
}

module.exports = MainWindow
