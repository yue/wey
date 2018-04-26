const gui  = require('gui')
const path = require('path')
const fs   = require('fs')

const MainWindow = require('./main-window')
const accountManager = require('../controller/account-manager')
const windowManager  = require('../controller/window-manager')
const singleInstance = require('../util/single-instance')

class NotificationCenter {
  constructor() {
    this.isRead = true
    this.mentions = 0

    if (process.platform !== 'darwin') {
      // Listen for new instances.
      singleInstance.listen(this.activateApp.bind(this))

      // Create tray icon.
      this.trayIcon = gui.Image.createFromPath(fs.realpathSync(path.join(__dirname, 'tray', 'icon.png')))
      this.attentionIcon = gui.Image.createFromPath(fs.realpathSync(path.join(__dirname, 'tray', 'attention.png')))
      this.mentionIcon = gui.Image.createFromPath(fs.realpathSync(path.join(__dirname, 'tray', 'mention.png')))
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
      onUpdateMentions: accountManager.onUpdateMentions.add(this.updateMentions.bind(this)),
    }
  }

  unload() {
    this.subscription.onUpdateReadState.detach()
    this.subscription.onUpdateMentions.detach()
    this.trayIcon = null
    this.tray = null
    if (process.platform !== 'darwin')
      singleInstance.clear()
  }

  updateReadState(isRead) {
    if (isRead === this.isRead)
      return
    this.isRead = isRead
    this.updateStatus()
  }

  updateMentions(mentions) {
    if (mentions === this.mentions)
      return
    this.mentions = mentions
    this.updateStatus()
  }

  updateStatus() {
    if (process.platform === 'darwin') {
      const label = this.mentions === 0 ? (this.isRead ? '' : '•') : String(this.mentions)
      gui.app.setDockBadgeLabel(label)
    } else {
      this.tray.setImage(this.mentions === 0 ? (this.isRead ? this.trayIcon : this.attentionIcon) : this.mentionIcon)
    }
  }

  activateApp() {
    const win = windowManager.getCurrentWindow()
    if (win)
      win.window.activate()
    else if (windowManager.windows.length > 0)
      windowManager.windows[0].window.activate()
    else
      new MainWindow
  }
}

module.exports = new NotificationCenter()
