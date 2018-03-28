const gui = require('gui')

const accountManager = require('../controller/account-manager')

class AppMenu {
  constructor() {
    const menus = []

    // The main menu.
    if (process.platform === 'darwin') {
      menus.push({
        label: require('../../package.json').productName,
        submenu: [
          {
            label: 'Quit',
            accelerator: 'Cmd+Q',
            onClick() { require('../controller/window-manager').quit() },
          },
        ],
      })
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
    for (const account of accountManager.accounts)
      this.onAddAccount(account)
    for (const service of accountManager.getServices()) {
      this.accountsMenu.append(gui.MenuItem.create({
        label: 'Login to ' + service.name,
        onClick: service.login.bind(service),
      }))
    }
    menus.push({label: 'Accounts', submenu: this.accountsMenu})
    this.subscriptions = {
      onAddAccount: accountManager.onAddAccount.add(this.onAddAccount.bind(this)),
      onRemoveAccount: accountManager.onRemoveAccount.add(this.onRemoveAccount.bind(this)),
    }

    // Create the native menu.
    this.menu = gui.MenuBar.create(menus)
  }

  onAddAccount(account) {
    const i = accountManager.accounts.length
    const item = gui.MenuItem.create({
      label: account.name,
      accelerator: `CmdOrCtrl+${i + 1}`,
      onClick: () => { accountManager.onChooseAccount.dispatch(account) },
    })
    this.accountsMenu.insert(item, i)
  }

  onRemoveAccount(account) {
    const i = accountManager.accounts.indexOf(account)
    this.accountsMenu.remove(this.accountsMenu.itemAt(i))
  }
}

module.exports = AppMenu
