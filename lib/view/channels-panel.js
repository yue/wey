const gui = require('gui')

const AccountInfoPanel = require('./account-info-panel')
const ChannelTitle = require('./channel-title')
const ChannelItem = require('./channel-item')

class ChannelsPanel {
  constructor(mainWindow) {
    this.mainWindow = mainWindow
    this.account = null
    this.channelItems = []
    this.selectedChannelItem = null

    this.view = gui.Container.create()
    this.view.setStyle({width: 180})
    this.view.setBackgroundColor('#2F3241')

    this.accountInfoPanel = new AccountInfoPanel()
    this.view.addChildView(this.accountInfoPanel.view)

    this.channelsListScroll = gui.Scroll.create()
    this.channelsListScroll.setStyle({flex: 1})
    this.view.addChildView(this.channelsListScroll)

    this.channelsList = gui.Container.create()
    this.channelsListScroll.setContentView(this.channelsList)

    this.channelTitle = new ChannelTitle(this)
    this.channelTitle.view.setVisible(false)
    this.channelsList.addChildView(this.channelTitle.view)
  }

  unload() {
    if (this.subscription) {
      this.subscription.onUpdateChannels.detach()
      this.subscription.onAddChannel.detach()
      this.subscription.onRemoveChannel.detach()
      this.subscription = null
    }
    this.unloadChannels()
    this.account = null
    process.gc()
  }

  loadAccount(account) {
    if (this.account)
      this.unload()
    if (!account.isReady)
      this.mainWindow.setLoading()
    this.account = account
    this.subscription = {
      onUpdateChannels: account.onUpdateChannels.add(this.loadChannels.bind(this)),
      onAddChannel: account.onAddChannel.add(this.addChannel.bind(this)),
      onRemoveChannel: account.onRemoveChannel.add(this.removeChannel.bind(this)),
    }
    this.loadChannels(account.channels)
    this.accountInfoPanel.loadAccount(account)
  }

  loadChannels(channels) {
    this.unloadChannels()
    if (channels.length > 0)
      this.channelTitle.view.setVisible(true)
    for (const c of channels) {
      const item = new ChannelItem(this, c)
      this.channelsList.addChildView(item.view)
      this.channelItems.push(item)
    }
    this.updateSize()
    if (this.account.currentChannelId) {
      // Select last selected channel.
      if (this.selectChannelById(this.account.currentChannelId))
        return
    } else {
      this.selectGeneralChannel()
    }
  }

  unloadChannels() {
    for (const item of this.channelItems) {
      item.unload()
      this.channelsList.removeChildView(item.view);
    }
    this.channelItems.splice(0, this.channelItems.length)
  }

  addChannel(index, channel) {
    const item = new ChannelItem(this, channel)
    this.channelsList.addChildViewAt(item.view, index + 1)
    this.channelItems.splice(index, 0, item)
    this.updateSize()
    if (!this.selectedChannelItem)
      this.selectChannelItem(item)
  }

  removeChannel(index, channel) {
    this.channelsList.removeChildView(this.channelItems[index].view)
    this.channelItems.splice(index, 1)
    this.updateSize()
    if (this.selectedChannelItem.channel === channel)
      this.selectGeneralChannel()
  }

  updateSize() {
    this.channelsListScroll.setContentSize({
      width: this.channelsListScroll.getBounds().width,
      height: this.channelsList.getPreferredSize().height,
    })
  }

  selectChannelById(id) {
    for (const i of this.channelItems) {
      if (i.channel.id == id) {
        this.selectChannelItem(i)
        return true
      }
    }
    return false
  }

  selectChannelItem(item) {
    if (item == this.selectedChannelItem)
      return
    if (this.selectedChannelItem)
      this.selectedChannelItem.deselect()
    this.selectedChannelItem = item
    if (item) {
      this.account.currentChannelId = item.channel.id
      item.select()
      this.mainWindow.chatBox.loadChannel(this.account, item.channel)
    } else {
      this.account.currentChannelId = null
    }
  }

  selectGeneralChannel() {
    if (this.channelItems.length === 0)
      return
    // Find the general channel.
    let item = this.channelItems.find((i) => i.channel.isDefault)
    // Otherwise just choose the first channel.
    if (!item)
      item = this.channelItems[0]
    this.selectChannelItem(item)
  }

  async showAllChannels() {
    this.selectChannelItem(null)
    this.mainWindow.setLoading()
    const channels = await this.account.getAllChannels()
    if (this.selectedChannelItem)
      return
    this.mainWindow.chatBox.view.setVisible(false)
    this.mainWindow.channelsSearcher.loadChannels(this.account, channels)
  }
}

module.exports = ChannelsPanel
