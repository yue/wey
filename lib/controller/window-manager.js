const accountsManager = require('./accounts-manager')

class WindowManager {
  constructor() {
    this.windows = []
  }

  addWindow(win) {
    if (this.windows.includes(win))
      throw new Error('Can not add existing window')
    this.windows.push(win)
  }

  removeWindow(win) {
    const i = this.windows.indexOf(win)
    if (i != -1)
      this.windows.splice(i, 1)
  }
}

module.exports = new WindowManager
