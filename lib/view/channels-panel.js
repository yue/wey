const gui = require('gui')

class ChannelsPanel {
  constructor() {
    this.view = gui.Container.create({})
    this.view.setStyle({
      flexDirection: 'column',
      padding: 5,
      width: 100,
    })
    this.view.setBackgroundColor('#BD443E')
  }
}

module.exports = ChannelsPanel
