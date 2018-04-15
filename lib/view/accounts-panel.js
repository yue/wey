const gui = require('gui')

const AccountButton = require('./account-button')

const accountManager = require('../controller/account-manager')

const ACCOUNTS_PANEL_BACKGROUND = '#232530'

class AccountsPanel {
  constructor(mainWindow) {
    this.mainWindow = mainWindow
    this.accountButtons = []

    if (process.platform == 'darwin') {
      this.view = gui.Vibrant.create()
      this.view.setMaterial('dark')
    } else {
      this.view = gui.Container.create()
      this.view.setBackgroundColor(ACCOUNTS_PANEL_BACKGROUND)
    }
    this.view.setStyle({
      flexDirection: 'column',
      width: 68,
      alignItems: 'center',
    })
    this.addButton = this.createAddButton()
    this.view.addChildView(this.addButton)
  }

  unload() {
    for (let button of this.accountButtons)
      button.unload()
  }

  createAddButton() {
    const addButton = gui.Button.create('+')
    addButton.setStyle({minWidth: 40, marginTop: 14})
    addButton.onClick = () => {
      const services = accountManager.getServices()
      const menu = gui.Menu.create(services.map((s) => {
        return {label: s.name, onClick: s.login.bind(s)}
      }))
      menu.popup()
    }
    return addButton
  }

  addAccountButton(account) {
    const button = new AccountButton(this.mainWindow, account)
    this.accountButtons.push(button)
    this.view.addChildViewAt(button.view, this.view.childCount() - 1)
  }

  removeAccountButton(account) {
    const i = this.accountButtons.findIndex((ab) => ab.account === account)
    if (i < 0)
      throw new Error(`Removing unknown account: ${account.name}`)
    const accountButton = this.accountButtons.splice(i, 1)[0]
    accountButton.unload()
    this.view.removeChildView(accountButton.view)
  }

  findAccountButton(account) {
    return this.accountButtons.find((ab) => ab.account === account)
  }
}

module.exports = AccountsPanel
