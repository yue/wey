const gui = require('gui')

class AccountsPanel {
  constructor() {
    this.view = gui.Container.create({})
    this.view.setStyle({
      flexDirection: 'column',
      padding: 5,
      width: 40,
    })
    this.view.setBackgroundColor('#FFF')
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
            })
          },
        }
      }))
      menu.popup()
    }
    return addButton
  }

  addAccount(account) {
    const accountButton = gui.Button.create(account.name)
    accountButton.setStyle({
      marginBottom: 5,
    })
    this.view.addChildViewAt(accountButton, this.view.childCount() - 1)
  }

  getServices() {
    throw new Error('This method should be connected by controller')
  }
}

module.exports = AccountsPanel
