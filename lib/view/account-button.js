const gui = require('gui')

class AccountButton {
  constructor(accountsPanel, account) {
    this.accountsPanel = accountsPanel
    this.account = account
    this.view = gui.Button.create(account.name)
    this.view.setStyle({
      marginBottom: 5,
    })
    this.view.onClick = () => {
      accountsPanel.chooseAccount(account)
    }
  }
}

module.exports = AccountButton
