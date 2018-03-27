const gui = require('gui')

const configStore = require('../controller/config-store')

class AppMenu {
  constructor() {
    const menus = []
    if (process.platform === 'darwin') {
      menus.push({
        label: 'Wey',
        submenu: [
          {
            label: 'Quit',
            accelerator: 'Cmd+Q',
            onClick: this.quit.bind(this),
          },
        ],
      })
    }
    menus.push({
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'select-all' },
      ],
    })
    this.menu = gui.MenuBar.create(menus)
  }

  quit() {
    configStore.serialize()
    gui.MessageLoop.quit()
    // Ignore pending Node.js works.
    process.exit(0)
  }
}

module.exports = AppMenu
