const gui = require('gui')

const accountManager = require('../controller/account-manager')

const ACCOUNT_NAME_COLOR = '#FFFFFF'
const HOVER_BACKGROUND = '#2B2E3B'
const PADDING = 10

class AccountHeader {
  constructor() {
    this.account = null

    this.hover = false

    // Toggle the menu when clicking on the panel.
    this.canShowMenu = false

    this.menu = gui.Menu.create([
      { label: 'Logout', onClick: this.logout.bind(this) },
    ])

    this.view = gui.Container.create()
    this.view.setStyle({width: '100%', height: 45})
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
    this.text = gui.AttributedText.create(this.account.name, {
      font: gui.Font.default().derive(8, 'semi-bold', 'normal'),
      color: ACCOUNT_NAME_COLOR,
      valign: 'center'
    })
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
    if (this.text) {
      bounds.x = PADDING
      bounds.width -= PADDING
      painter.drawAttributedText(this.text, bounds)
    }
  }
}

module.exports = AccountHeader
