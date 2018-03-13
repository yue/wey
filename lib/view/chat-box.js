const gui = require('gui')

class ChatBox {
  constructor() {
    this.view = gui.Browser.create({})
    this.view.setStyle({
      flex: 1,
    })
  }
}

module.exports = ChatBox
