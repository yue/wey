const gui = require('gui')

const AccountButton = require('./account-button')

const accountManager = require('../controller/account-manager')

const ACCOUNTS_PANEL_BACKGROUND = '#171820'

class AccountsPanel {
  constructor(mainWindow) {
    this.mainWindow = mainWindow
    this.selectedAccount = null
    this.accountButtons = []
    this.subscriptions = {
      onAddAccount: accountManager.onAddAccount.add(this.onAddAccount.bind(this)),
      onRemoveAccount: accountManager.onRemoveAccount.add(this.onRemoveAccount.bind(this)),
      onChooseAccount: accountManager.onChooseAccount.add(this.chooseAccount.bind(this)),
    }

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

  initWithConfig(config) {
    for (const account of accountManager.accounts)
      this.onAddAccount(account)
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
    addButton.setStyle({width: 40, marginTop: 14})
    addButton.onClick = () => {
      const services = accountManager.getServices()
      const menu = gui.Menu.create(services.map((s) => {
        return {label: s.name, onClick: s.login.bind(s)}
      }))
      menu.popup()
    }
    return addButton
  }

  onAddAccount(account) {
    const button = new AccountButton(this, account)
    this.accountButtons.push(button)
    this.view.addChildViewAt(button.view, this.view.childCount() - 1)
  }

  onRemoveAccount(account) {
    const i = this.accountButtons.findIndex((ab) => ab.account === account)
    if (i < 0)
      throw new Error(`Removing unknown account: ${account.name}`)
    const accountButton = this.accountButtons.splice(i, 1)[0]
    this.view.removeChildView(accountButton.view)

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
    this.mainWindow.window.setTitle(account.service.name + ' | ' + account.name)
  }

  findAccountButton(account) {
    return this.accountButtons.find((ab) => ab.account === account)
  }
}

module.exports = AccountsPanel
