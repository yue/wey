const gui = require('gui')

const AccountInfoPanel = require('./account-info-panel')
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
  }

  unload() {
    this.unloadChannels()
    this.subscription.detach()
    this.subscription = null
    this.account = null
  }

  loadAccount(account) {
    if (this.account)
      this.unload()
    this.account = account
    this.subscription = account.onUpdateChannels.add(this.loadChannels.bind(this))
    this.loadChannels(account.channels)
    this.accountInfoPanel.loadAccount(account)
  }

  loadChannels(channels) {
    this.unloadChannels()
    for (const c of channels) {
      if (!c.isMember)
        continue
      const item = new ChannelItem(this, c)
      this.channelsList.addChildView(item.view)
      this.channelItems.push(item)
    }
    this.channelsListScroll.setContentSize({
      width: this.channelsListScroll.getBounds().width,
      height: this.channelsList.getPreferredSize().height,
    })
    if (this.account.currentChannelId) {
      // Select last channel.
      for (const i of this.channelItems) {
        if (i.channel.id == this.account.currentChannelId) {
          this.selectChannelItem(i)
          return
        }
      }
    } else if (this.channelItems.length > 0) {
      // Find the general channel.
      let tochoose = this.channelItems.find((i) => i.channel.isDefault)
      // Otherwise just choose the first channel
      tochoose = this.channelItems[0]
      this.selectChannelItem(tochoose)
    }
  }

  unloadChannels() {
    for (const item of this.channelItems) {
      item.unload()
      this.channelsList.removeChildView(item.view);
    }
    this.channelItems.splice(0, this.channelItems.length)
  }

  selectChannelItem(item) {
    if (item == this.selectedChannelItem)
      return
    if (this.selectedChannelItem)
      this.selectedChannelItem.deselect()
    this.account.currentChannelId = item.channel.id
    this.selectedChannelItem = item
    item.select()

    this.mainWindow.chatBox.loadChannel(this.account, item.channel)
  }
}

module.exports = ChannelsPanel
