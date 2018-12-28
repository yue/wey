const gui = require('gui')

const imageStore = require('../controller/image-store')

const FOCUS_BAR_COLOR = process.platform === 'darwin' ? '#FFF' : '#938E92'

function RoundedCornerPath(painter, r, radius) {
  const degrees = Math.PI / 180
  painter.beginPath()
  painter.arc({x: r.x + r.width - radius, y: r.y + radius},
              radius, -90 * degrees, 0)
  painter.arc({x: r.x + r.width - radius, y: r.y + r.height - radius},
              radius, 0, 90 * degrees)
  painter.arc({x: r.x + radius, y: r.y + r.height - radius},
              radius, 90 * degrees, 180 * degrees)
  painter.arc({x: r.x + radius, y: r.y + radius},
              radius, 180 * degrees, 270 * degrees)
  painter.closePath()
}

class AccountButton {
  constructor(mainWindow, account) {
    this.account = account
    this.active = false
    this.subscription = {
      onUpdateInfo: account.onUpdateInfo.add(this.updateInfo.bind(this)),
      onUpdateChannels: account.onUpdateChannels.add(this.updateChannels.bind(this)),
      onUpdateReadState: account.onUpdateReadState.add(this.update.bind(this)),
    }

    this.image = null
    this.textAttributes = {
      font: gui.Font.create('Helvetica', 35, 'normal', 'normal'),
      color: '#FFF',
      align: 'center',
      valign: 'center',
    }
    this.view = gui.Container.create()
    this.view.setMouseDownCanMoveWindow(false)
    this.view.setStyle({
      marginTop: 14,
      width: 68,
      height: 40,
    })
    this.view.onMouseUp = () => mainWindow.selectAccount(account)
    this.view.onDraw = this.draw.bind(this)

    this.updateInfo()
  }

  unload() {
    this.subscription.onUpdateInfo.detach()
    this.subscription.onUpdateChannels.detach()
    this.subscription.onUpdateReadState.detach()
  }

  async updateInfo() {
    if (this.account.icon)
      this.image = gui.Image.createFromPath(await imageStore.fetchImage(this.account.icon))
    this.view.schedulePaint()
  }

  updateChannels() {
    // For unfocused account, preload its current channel.
    if (!this.active) {
      const channel = this.account.findChannelById(this.account.currentChannelId)
      if (channel) {
        // Turn on receiving mode of channel, and automatically turn it off
        // after some timeout if user has never opened it.
        channel.startReceiving()
        channel.stopReceiving()
        // Asynchronously load messages.
        channel.readMessages()
      }
    }
  }

  update() {
    this.view.schedulePaint()
  }

  setActive(active) {
    this.active = active
    this.view.schedulePaint()
  }

  draw(view, painter, dirty) {
    // White bar.
    if (this.active) {
      painter.setFillColor(FOCUS_BAR_COLOR)
      RoundedCornerPath(painter, {x: -4, y: 0, width: 8, height: 40}, 5)
      painter.fill()
    } else if (!this.account.isRead) {
      painter.setFillColor(FOCUS_BAR_COLOR)
      RoundedCornerPath(painter, {x: -4, y: 16, width: 8, height: 8}, 4)
      painter.fill()
    }
    // Rounded corner.
    const bounds = {x: 14, y: 0, width: 40, height: 40}
    RoundedCornerPath(painter, bounds, 5)
    painter.clip()
    // Icon.
    if (this.image) {
      painter.drawImage(this.image, bounds)
    } else {
      painter.setFillColor('#333')
      painter.fillRect(bounds)
      painter.drawText(this.account.name[0], bounds, this.textAttributes)
    }
    // Transparent mask.
    if (!this.active) {
      painter.setFillColor('#8FFF')
      painter.fillRect(bounds)
    }
  }
}

module.exports = AccountButton
