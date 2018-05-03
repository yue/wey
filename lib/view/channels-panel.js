const gui = require('gui')

const AccountHeader = require('./account-header')
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
    this.view.setStyle({width: 220})
    this.view.setBackgroundColor('#2F3241')

    this.accountHeader = new AccountHeader()
    this.view.addChildView(this.accountHeader.view)

    this.channelsListScroll = gui.Scroll.create()
    this.channelsListScroll.setStyle({flex: 1})
    if (process.platform === 'win32') {
      // On Windows there is no overlay scrollbar.
      this.channelsListScroll.setScrollbarPolicy('never', 'never')
    } else {
      // Force using overlay scrollbar.
      this.channelsListScroll.setOverlayScrollbar(true)
      this.channelsListScroll.setScrollbarPolicy('never', 'automatic')
    }
    this.view.addChildView(this.channelsListScroll)

    this.channelsList = gui.Container.create()
    this.channelsList.setStyle({paddingBottom: 15})
    this.channelsListScroll.setContentView(this.channelsList)

    this.channelTitle = new ChannelTitle('Channels')
    this.channelTitle.view.setStyle({marginLeft: 10})
    this.channelTitle.view.onMouseUp = () => mainWindow.showAllChannels(this.account)

    this.dmsTitle = new ChannelTitle('Direct Messages')
    this.dmsTitle.view.setStyle({marginTop: 15, marginLeft: 10})
    this.dmsTitle.view.onMouseUp = () => mainWindow.showAllUsers(this.account)
  }

  unload() {
    if (this.subscription) {
      this.subscription.onUpdateChannels.detach()
      this.subscription.onAddChannel.detach()
      this.subscription.onRemoveChannel.detach()
      this.subscription.onOpenDM.detach()
      this.subscription.onCloseDM.detach()
      this.subscription = null
    }
    this.unloadChannels()
    this.account = null
    process.gc()
  }

  loadAccount(account) {
    if (this.account)
      this.unload()
    if (!account.isChannelsReady)
      this.mainWindow.setLoading()
    this.account = account
    this.subscription = {
      onUpdateChannels: account.onUpdateChannels.add(this.loadChannels.bind(this)),
      onAddChannel: account.onAddChannel.add(this.addChannel.bind(this)),
      onRemoveChannel: account.onRemoveChannel.add(this.removeChannel.bind(this)),
      onOpenDM: account.onOpenDM.add(this.openDM.bind(this)),
      onCloseDM: account.onCloseDM.add(this.closeDM.bind(this)),
    }
    this.accountHeader.loadAccount(account)
    this.loadChannels()
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

  loadChannels() {
    this.unloadChannels()
    if (this.account.channels.length === 0)
      return
    this.channelsList.addChildView(this.channelTitle.view)
    for (const c of this.account.channels) {
      const item = new ChannelItem(this, c)
      this.channelsList.addChildView(item.view)
      this.channelItems.push(item)
    }
    this.channelsList.addChildView(this.dmsTitle.view)
    for (const c of this.account.dms) {
      const item = new ChannelItem(this, c)
      this.channelsList.addChildView(item.view)
      this.channelItems.push(item)
    }
    this.updateSize()
    this.selectCurrentChannel()
  }

  unloadChannels() {
    this.channelsList.removeChildView(this.channelTitle.view)
    this.channelsList.removeChildView(this.dmsTitle.view)
    for (const item of this.channelItems) {
      item.unload()
      this.channelsList.removeChildView(item.view)
    }
    this.channelItems = []
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

  openDM(index, channel) {
    this.addChannel(index + this.account.channels.length + 2, channel)
  }

  closeDM(index, channel) {
    const dmIndex = index + this.account.channels.length
    this.channelsList.removeChildView(this.channelItems[dmIndex].view)
    this.channelItems.splice(dmIndex, 1)
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
      this.mainWindow.loadChannel(item.channel)
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
