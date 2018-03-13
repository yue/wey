const gui = require('gui')

class AccountsPanel {
  constructor() {
    this.view = gui.Container.create({})
    this.view.setStyle({
      flexDirection: 'column',
      padding: 5,
      width: 40,
    })
    this.view.setBackgroundColor('#FFF')
  }
}

module.exports = AccountsPanel
