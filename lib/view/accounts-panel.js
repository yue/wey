const gui = require('gui')

const AccountButton = require('./account-button')

const accountManager = require('../controller/account-manager')

const ACCOUNTS_PANEL_BACKGROUND = '#171820'

class AccountsPanel {
  constructor(mainWindow) {
    this.mainWindow = mainWindow
    this.selectedAccount = null
    this.accountButtons = []
    this.subscriptions = {}

    if (process.platform == 'darwin') {
      this.view = gui.Vibrant.create()
      this.view.setMaterial('dark')
    } else {
      this.view = gui.Container.create()
      this.view.setBackgroundColor(ACCOUNTS_PANEL_BACKGROUND)
    }
    this.view.setStyle({
      flexDirection: 'column',
      padding: 5,
      width: 40,
    })
    this.addButton = this.createAddButton()
    this.view.addChildView(this.addButton)
  }

  serialize() {
    const config = {}
    if (this.selectedAccount)
      Object.assign(config, {selectedAccount: this.selectedAccount.id})
    return config
  }

  deserialize(config) {
    for (const account of accountManager.accounts)
      this.addAccount(account)
    if (config.selectedAccount) {
      const account = accountManager.findAccountById(config.selectedAccount)
      if (account) {
        this.chooseAccount(account)
        return
      }
    }
    if (accountManager.accounts.length > 0)
      this.chooseAccount(accountManager.accounts[0])
  }

  createAddButton() {
    const addButton = gui.Button.create('+')
    addButton.onClick = () => {
      const services = accountManager.getServices()
      const menu = gui.Menu.create(services.map((s) => {
        return {
          label: s.name,
          onClick: () => {
            s.login((error, account) => {
              if (error) {
                // TODO: Show error box.
                console.error(error)
                return
              }
              this.addAccount(account)
              this.chooseAccount(account)
            })
          },
        }
      }))
      menu.popup()
    }
    return addButton
  }

  addAccount(account) {
    const button = new AccountButton(this, account)
    this.accountButtons.push(button)
    this.view.addChildViewAt(button.view, this.view.childCount() - 1)
    this.subscriptions[account] = account.onRemove.add(this.removeAccount.bind(this))
  }

  removeAccount(account) {
    const i = this.accountButtons.findIndex((ab) => ab.account === account)
    if (i < 0)
      throw new Error(`Removing unknown account: ${account.name}`)
    const accountButton = this.accountButtons.splice(i, 1)[0]
    this.view.removeChildView(accountButton.view)
    delete this.subscriptions[account]

    if (this.selectedAccount === account) {
      if (this.accountButtons.length === 0) {
        this.mainWindow.channelsPanel.unloadChannels()
      } else {
        this.chooseAccount(this.accountButtons[0].account)
      }
    }
  }

  chooseAccount(account) {
    if (account === this.selectedAccount)
      return
    this.selectedAccount = account
    this.mainWindow.channelsPanel.loadAccount(account)
  }
}

module.exports = AccountsPanel
