const gui = require('gui')

class ChannelsPanel {
  constructor() {
    this.account = null
    this.view = gui.Container.create({})
    this.view.setStyle({
      flexDirection: 'column',
      padding: 5,
      width: 100,
    })
    this.view.setBackgroundColor('#BD443E')
  }

  loadAccount(account) {
    if (this.account)
      this.unloadCurrentAccount()
    this.account = account
    this.subscription = account.onUpdateChannels.add(this.loadChannels.bind(this))
    this.loadChannels(account.channels)
  }

  unloadCurrentAccount() {
    this.subscription.detach()
    this.subscription = null
    this.account = null
  }

  loadChannels(channels) {
    while (this.view.childCount() > 0)
      this.view.removeChildView(this.view.childAt(0));
    for (const c of channels)
      this.view.addChildView(gui.Label.create(c.name))
  }
}

module.exports = ChannelsPanel
