const gui = require('gui')

const accountManager = require('../controller/account-manager')

const ACCOUNT_NAME_COLOR = '#FFFFFF'
const HOVER_BACKGROUND = '#2B2E3B'
const PADDING = 15

class AccountInfoPanel {
  constructor(account) {
    this.account = null

    this.font = gui.Font.default().derive(12, 'semi-bold', 'normal')
    this.hover = false

    // Toggle the menu when clicking on the panel.
    this.canShowMenu = false

    this.menu = gui.Menu.create([
      { label: 'Logout', onClick: this.logout.bind(this) },
    ])

    this.view = gui.Container.create()
    this.view.setStyle({
      width: '100%',
      minHeight: 60
    })
    this.view.onDraw = this.draw.bind(this)
    this.view.onMouseEnter = () => {
      this.hover = true
      this.canShowMenu = true
      this.view.schedulePaint()
    }
    this.view.onMouseLeave = () => {
      this.hover = false
      this.canShowMenu = true
      this.view.schedulePaint()
    }
    this.view.onMouseUp = () => {
      if (!this.hover)
        return
      if (!this.canShowMenu) {
        this.canShowMenu = true
        return
      }
      this.canShowMenu = false
      this.menu.popup()
    }
  }

  loadAccount(account) {
    this.account = account
    this.view.schedulePaint()
  }

  logout() {
    accountManager.removeAccount(this.account)
  }

  draw(view, painter, dirty) {
    if (!this.account)
      return
    const bounds = Object.assign(view.getBounds(), {x: 0, y: 0})
    if (this.hover) {
      painter.setFillColor(HOVER_BACKGROUND)
      painter.fillRect(bounds)
    }
    const attributes = { font: this.font, color: ACCOUNT_NAME_COLOR }
    bounds.x = PADDING
    bounds.y = PADDING
    painter.drawText(this.account.name, bounds, attributes)
  }
}

module.exports = AccountInfoPanel
