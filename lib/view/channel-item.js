const gui = require('gui')

const NORMAL_COLOR = '#C1C2C6'
const SELECTED_COLOR = '#FFFFFF'
const HOVER_BACKGROUND = '#2B2E3B'
const SELECTED_BACKGROUND = '#6798A2'
const PADDING = 5

class ChannelItem {
  constructor(parent, channel) {
    this.parent = parent
    this.channel = channel
    this.subscription = channel.onMessage.add(this.update.bind(this))

    this.hover = false
    this.selected = false
    this.unread = false

    this.view = gui.Container.create()
    this.view.setMouseDownCanMoveWindow(false)
    this.view.setStyle({
      height: 30,
    })
    this.view.onDraw = this.draw.bind(this)
    this.view.onMouseEnter = () => {
      this.hover = true
      this.view.schedulePaint()
    }
    this.view.onMouseLeave = () => {
      this.hover = false
      this.view.schedulePaint()
    }
    this.view.onMouseUp = () => this.parent.selectChannelItem(this)
  }

  unload() {
    this.subscription.detach()
  }

  select() {
    this.selected = true
    this.view.schedulePaint()
  }

  deselect() {
    this.selected = false
    this.view.schedulePaint()
  }

  update() {
    this.view.schedulePaint()
  }

  draw(view, painter, dirty) {
    const bounds = Object.assign(view.getBounds(), {x: 0, y: 0})
    const attributes = {color: NORMAL_COLOR, align: "start", valign: "center"}
    if (this.selected) {
      attributes.color = SELECTED_COLOR
      painter.setFillColor(SELECTED_BACKGROUND)
      painter.fillRect(bounds)
    } else if (this.hover) {
      painter.setFillColor(HOVER_BACKGROUND)
      painter.fillRect(bounds)
    }
    const textRect = {x: PADDING, y: 0, width: bounds.width, height: 30}
    painter.drawText('# ' + this.channel.name, textRect, attributes)
  }
}

module.exports = ChannelItem
