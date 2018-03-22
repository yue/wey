const gui = require('gui')

const AccountInfoPanel = require('./account-info-panel')
const ChannelItem = require('./channel-item')

class ChannelsPanel {
  constructor() {
    this.account = null
    this.channelItems = []
    this.selectedChannelItem = null

    this.view = gui.Container.create({})
    this.view.setStyle({
      flexDirection: 'column',
      width: 100,
    })
    this.view.setBackgroundColor('#2F3241')

    this.accountInfoPanel = new AccountInfoPanel()
    this.view.addChildView(this.accountInfoPanel.view)
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
      const item = new ChannelItem(this, c)
      this.view.addChildView(item.view)
      this.channelItems.push(item)
    }
  }

  unloadChannels() {
    for (const item of this.channelItems) {
      item.unload()
      this.view.removeChildView(item.view);
    }
    this.channelItems.splice(0, this.channelItems.length)
  }

  selectChannelItem(item) {
    if (item == this.selectedChannelItem)
      return
    if (this.selectedChannelItem)
      this.selectedChannelItem.deselect()
    this.selectedChannelItem = item
    item.select()
  }
}

module.exports = ChannelsPanel
