const gui = require('gui')

const AccountButton = require('./account-button')

const ACCOUNTS_PANEL_BACKGROUND = '#171820'

class AccountsPanel {
  constructor(mainWindow) {
    this.mainWindow = mainWindow
    this.selectedAccount = null

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

  createAddButton() {
    const addButton = gui.Button.create('+')
    addButton.onClick = () => {
      const services = this.getServices()
      const menu = gui.Menu.create(services.map((s) => {
        return {
          label: s.name,
          onClick: () => {
            s.login((error, account) => {
              if (error) {
                // TODO: Show error box.
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
    this.view.addChildViewAt(button.view, this.view.childCount() - 1)
  }

  chooseAccount(account) {
    if (account === this.selectedAccount)
      return
    this.selectedAccount = account
    this.mainWindow.channelsPanel.loadAccount(account)
  }

  getServices() {
    throw new Error('This method should be connected by controller')
  }
}

module.exports = AccountsPanel
