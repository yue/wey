const gui = require('gui')

const AccountInfoPanel = require('./account-info-panel')
const ChannelTitle = require('./channel-title')
const ChannelItem = require('./channel-item')

class ChannelsPanel {
  constructor(mainWindow) {
    this.mainWindow = mainWindow
    this.account = null
    this.channelItems = []
    this.dmItems = []
    this.selectedChannelItem = null

    this.view = gui.Container.create()
    this.view.setStyle({width: 180})
    this.view.setBackgroundColor('#2F3241')

    this.accountInfoPanel = new AccountInfoPanel()
    this.view.addChildView(this.accountInfoPanel.view)

    this.channelsListScroll = gui.Scroll.create()
    this.channelsListScroll.setStyle({flex: 1})
    // TODO Also do it for linux if overlay scrollbar is not used.
    if (process.platform === 'win32')
      this.channelsListScroll.setScrollbarPolicy('never', 'never')
    this.view.addChildView(this.channelsListScroll)

    this.channelsList = gui.Container.create()
    this.channelsList.setStyle({paddingBottom: 15})
    this.channelsListScroll.setContentView(this.channelsList)

    this.channelTitle = new ChannelTitle('Channels')
    this.channelTitle.view.setVisible(false)
    this.channelTitle.view.onMouseUp = () => mainWindow.showAllChannels(this.account)
    this.channelsList.addChildView(this.channelTitle.view)

    this.directMessagesTitle = new ChannelTitle('Direct Messages')
    this.directMessagesTitle.view.setVisible(false)
    this.directMessagesTitle.view.setStyle({marginTop: 15})
    this.directMessagesTitle.view.onMouseUp = () => mainWindow.showAllUsers(this.account)
    this.channelsList.addChildView(this.directMessagesTitle.view)
  }

  unload() {
    if (this.subscription) {
      this.subscription.onUpdateChannels.detach()
      this.subscription.onUpdateDirectMessages.detach()
      this.subscription.onAddChannel.detach()
      this.subscription.onRemoveChannel.detach()
      this.subscription = null
    }
    this.unloadChannels()
    this.unloadDirectMessages()
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
      onUpdateDirectMessages: account.onUpdateDirectMessages.add(this.loadDirectMessages.bind(this)),
      onAddChannel: account.onAddChannel.add(this.addChannel.bind(this)),
      onRemoveChannel: account.onRemoveChannel.add(this.removeChannel.bind(this)),
    }
    this.accountInfoPanel.loadAccount(account)
    this.loadChannels(account.channels)
    this.loadDirectMessages(account.directMessages)
  }

  selectCurrentChannel() {
    if (this.account.currentChannelId) {
      // Select last selected channel.
      if (this.selectChannelById(this.account.currentChannelId))
        return
    } else {
      this.selectGeneralChannel()
    }
  }

  loadChannels(channels) {
    this.unloadChannels()
    if (channels.length > 0)
      this.channelTitle.view.setVisible(true)
    for (const c of channels) {
      const item = new ChannelItem(this, c)
      this.channelsList.addChildViewAt(item.view, 1 + this.channelItems.length)
      this.channelItems.push(item)
    }
    this.updateSize()
    this.selectCurrentChannel()
  }

  unloadChannels() {
    for (const item of this.channelItems) {
      item.unload()
      this.channelsList.removeChildView(item.view);
    }
    this.channelItems.splice(0, this.channelItems.length)
  }

  loadDirectMessages(directMessages) {
    this.unloadDirectMessages()
    if (directMessages.length > 0)
      this.directMessagesTitle.view.setVisible(true)
    for (const dm of directMessages) {
      const item = new ChannelItem(this, dm)
      this.channelsList.addChildViewAt(item.view, 2 + this.channelItems.length + this.dmItems.length)
      this.dmItems.push(item)
    }
    this.updateSize()
    this.selectCurrentChannel()
  }

  unloadDirectMessages() {
    for (const item of this.dmItems) {
      item.unload()
      this.channelsList.removeChildView(item.view);
    }
    this.dmItems.splice(0, this.dmItems.length)
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
    let item = this.channelItems.find((i) => i.channel.id === id)
    if (!item)
      item = this.dmItems.find((i) => i.channel.id === id)
    if (!item)
      return false
    this.selectChannelItem(item)
    return true
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
      this.mainWindow.loadChannel(this.account, item.channel)
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
}

module.exports = ChannelsPanel
