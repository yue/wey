const gui = require('gui')

const accountManager = require('../controller/account-manager')

class AppMenu {
  constructor(win) {
    const menus = []

    // The main menu.
    menus.push({
      label: require('../../package.json').build.productName,
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          onClick() {
            for (const a of accountManager.accounts)
              a.reload()
          },
        },
        { type: 'separator' },
        {
          label: 'Disconnect',
          onClick() {
            for (const a of accountManager.accounts)
              a.disconnect()
          }
        },
        {
          label: 'Collect Garbage',
          accelerator: 'CmdOrCtrl+Shift+G',
          onClick() { process.gc(true) },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          onClick() { require('../controller/window-manager').quit() },
        },
      ],
    })

    // macOS specific app menus.
    if (process.platform === 'darwin') {
      menus[0].submenu.splice(menus[0].submenu.length - 2, 0,
                              { type: 'separator' },
                              { role: 'hide' },
                              { role: 'hide-others' },
                              { type: 'separator' })
    }

    // Edit menu.
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

    // Accounts menu.
    this.accountsMenu = gui.Menu.create([
      { type: 'separator' },
    ])
    for (let i = 0; i < accountManager.accounts.length; ++i)
      this.addAccount(win, i, accountManager.accounts[i])
    for (const service of accountManager.getServices()) {
      this.accountsMenu.append(gui.MenuItem.create({
        label: 'Login to ' + service.name,
        onClick: service.login.bind(service),
      }))
    }
    menus.push({label: 'Accounts', submenu: this.accountsMenu})
    this.subscription = {
      onAddAccount: accountManager.onAddAccount.add(this.accountCreated.bind(this, win)),
      onRemoveAccount: accountManager.onRemoveAccount.add(this.removeAccount.bind(this)),
    }

    // Windows menu.
    menus.push({
      label: 'Window',
      role: 'window',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+Shift+N',
          onClick: this.newWindow.bind(this),
        },
        {
          label: 'Close Window',
          accelerator: 'CmdOrCtrl+W',
          onClick: this.closeWindow.bind(this, win),
        },
      ],
    })

    // Create the native menu.
    this.menu = gui.MenuBar.create(menus)
  }

  unload() {
    this.subscription.onAddAccount.detach()
    this.subscription.onRemoveAccount.detach()
  }

  accountCreated(win, account) {
    this.addAccount(win, accountManager.accounts.length, account)
  }

  addAccount(win, i, account) {
    const item = gui.MenuItem.create({
      label: account.name,
      accelerator: `CmdOrCtrl+${i + 1}`,
      onClick: this.selectAccount.bind(this, win, account)
    })
    this.accountsMenu.insert(item, i)
  }

  removeAccount(account, index) {
    this.accountsMenu.remove(this.accountsMenu.itemAt(index))
  }

  selectAccount(win, account) {
    if (process.platform === 'darwin')
      win = require('../controller/window-manager').getCurrentWindow()
    if (win && win.selectAccount)
      win.selectAccount(account)
  }

  newWindow() {
    const MainWindow = require('./main-window')
    new MainWindow()
  }

  closeWindow(win) {
    if (process.platform === 'darwin') {
      win = require('../controller/window-manager').getCurrentWindow()
      if (win)
        win.window.close()
    } else {
      win.window.close()
    }
  }
}

module.exports = AppMenu
