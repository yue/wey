const gui = require('gui')

const AppMenu = require('../view/app-menu')

class WindowManager {
  constructor() {
    this.windows = []
    this.config = {}

    if (process.platform === 'darwin') {
      this.appMenu = new AppMenu()
      gui.app.setApplicationMenu(this.appMenu.menu)
    } else {
      this.menubars = []
    }
  }

  serialize() {
    for (const win of this.windows)
      Object.assign(this.config, win.serialize())
    return this.config
  }

  deserialize(config) {
    this.config = config
  }

  addWindow(win) {
    if (this.windows.includes(win))
      throw new Error('Can not add existing window')
    this.windows.push(win)
    if (process.platform !== 'darwin') {
      const menubar = new AppMenu()
      this.menubars.push(menubar)
      win.setMenuBar(menubar.menu)
    }
    win.deserialize(this.config)
    win.onClose = () => this.removeWindow(win)
  }

  removeWindow(win) {
    const i = this.windows.indexOf(win)
    if (i === -1)
      return
    this.windows.splice(i, 1)
    this.menubars.splice(i, 1)
  }
}

module.exports = new WindowManager
