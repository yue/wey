const gui = require('gui')

const accountManager = require('./account-manager')

class NotificationManager {
  constructor() {
    this.subscription = {
      onUpdateReadState: accountManager.onUpdateReadState.add(this.updateReadState.bind(this)),
    }
  }

  updateReadState(isRead) {
    if (process.platform === 'darwin')
      gui.app.setDockBadgeLabel(isRead ? '' : '•')
  }
}

module.exports = new NotificationManager()
