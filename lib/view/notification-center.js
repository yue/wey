const gui = require('gui')
const path = require('path')
const fs = require('fs')

const MainWindow = require('./main-window')
const accountManager = require('../controller/account-manager')
const windowManager = require('../controller/window-manager')

class NotificationCenter {
  constructor() {
    this.isRead = true

    if (process.platform !== 'darwin') {
      this.trayIcon = gui.Image.createFromPath(fs.realpathSync(path.join(__dirname, 'tray', 'icon.png')))
      this.attentionIcon = gui.Image.createFromPath(fs.realpathSync(path.join(__dirname, 'tray', 'attention.png')))
      this.tray = gui.Tray.createWithImage(this.trayIcon)
      this.tray.onClick = this.activateApp.bind(this)

      const menu = gui.Menu.create([
        {
          label: 'Show',
          onClick: this.activateApp.bind(this)
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

  unload() {
    this.subscription.onUpdateReadState.detach()
    this.trayIcon = null
    this.tray = null
  }

  updateReadState(isRead) {
    if (isRead === this.isRead)
      return
    this.isRead = isRead

    if (process.platform === 'darwin')
      gui.app.setDockBadgeLabel(isRead ? '' : '•')
    else
      this.tray.setImage(isRead ? this.trayIcon : this.attentionIcon)
  }

  activateApp() {
    const win = windowManager.getCurrentWindow()
    if (win)
      win.window.activate()
    else if (windowManager.windows.length > 0)
      windowManager.windows[0].activate()
    else
      new MainWindow
  }
}

module.exports = new NotificationCenter()
