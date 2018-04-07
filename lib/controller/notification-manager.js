const gui = require('gui')

const MainWindow = require('../view/main-window')
const accountManager = require('./account-manager')
const windowManager = require('./window-manager')

class NotificationManager {
  constructor() {
    if (process.platform !== 'darwin') {
      const icon = gui.Image.createFromPath('/usr/share/pixmaps/fedora-logo-sprite.png')
      this.tray = gui.Tray.createWithImage(icon)

      const menu = gui.Menu.create([
        {
          label: 'Show',
          onClick() {
            const win = windowManager.getCurrentWindow()
            if (win)
              win.activate()
            else
              new MainWindow
          }
        },
        {
          label: 'Quit',
          onClick() { windowManager.quit() }
        },
      ])
      this.tray.setMenu(menu)
    }

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
