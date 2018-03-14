class WindowManager {
  constructor(accountsManager) {
    this.accountsManager = accountsManager
    this.windows = []
  }

  addWindow(win) {
    if (this.windows.includes(win))
      throw new Error('Can not add existing window')
    this.windows.push(win)
    win.window.onClose = (self) => {
      const i = this.windows.indexOf(self)
      if (i != -1)
        this.windows.splice(i, 1)
    }
    win.accountsPanel.getServices = () => {
      return this.accountsManager.getServices()
    }
  }
}

module.exports = WindowManager
