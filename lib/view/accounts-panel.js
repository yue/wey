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
      padding: 10,
      width: 60,
    })
    this.addButton = this.createAddButton()
    this.view.addChildView(this.addButton)
  }

  initWithConfig(config) {
    for (const account of accountManager.accounts)
      this.addAccount(account)
    // Choose remembered account.
    if (config.selectedAccount) {
      const account = accountManager.findAccountById(config.selectedAccount)
      if (account) {
        this.chooseAccount(account)
        return
      }
    }
    // If nothing chose before then choose the first account.
    if (accountManager.accounts.length > 0)
      this.chooseAccount(accountManager.accounts[0])
  }

  getConfig() {
    const config = {}
    if (this.selectedAccount)
      Object.assign(config, {selectedAccount: this.selectedAccount.id})
    return config
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
              account = this.addAccount(account)
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
    // User may try to add duplicate account.
    for (const b of this.accountButtons) {
      if (b.account.id === account.id)
        return b.account
    }

    const button = new AccountButton(this, account)
    this.accountButtons.push(button)
    this.view.addChildViewAt(button.view, this.view.childCount() - 1)
    this.subscriptions[account] = {
      onRemove: account.onRemove.add(this.removeAccount.bind(this)),
      onUpdateInfo: account.onUpdateInfo.add(this.updateAccountInfo.bind(this)),
    }
    return account
  }

  removeAccount(account) {
    const i = this.accountButtons.findIndex((ab) => ab.account === account)
    if (i < 0)
      throw new Error(`Removing unknown account: ${account.name}`)
    const accountButton = this.accountButtons.splice(i, 1)[0]
    this.view.removeChildView(accountButton.view)
    this.subscriptions[account].onRemove.detach()
    this.subscriptions[account].onUpdateInfo.detach()
    delete this.subscriptions[account]

    if (this.selectedAccount === account) {
      this.selectedAccount = null
      if (this.accountButtons.length === 0) {
        this.mainWindow.channelsPanel.unloadChannels()
      } else {
        this.chooseAccount(this.accountButtons[0].account)
      }
    }
  }

  chooseAccount(account) {
    if (this.selectedAccount === account)
      return
    if (this.selectedAccount)
      this.findAccountButton(this.selectedAccount).setActive(false)
    this.selectedAccount = account
    this.findAccountButton(this.selectedAccount).setActive(true)
    this.mainWindow.channelsPanel.loadAccount(account)
  }

  updateAccountInfo(account) {
    const accountButton = this.findAccountButton(account)
    if (accountButton)
      accountButton.update()
  }

  findAccountButton(account) {
    return this.accountButtons.find((ab) => ab.account === account)
  }
}

module.exports = AccountsPanel
