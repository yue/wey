const gui = require('gui')

const NORMAL_COLOR = '#C1C2C6'
const SELECTED_COLOR = '#FFFFFF'
const HOVER_BACKGROUND = '#2B2E3B'
const SELECTED_BACKGROUND = '#6798A2'
const PADDING = 5

const defaultFont = gui.Font.default()
const UNREAD_FONT = gui.Font.create(defaultFont.getName(),
                                    defaultFont.getSize(),
                                    'bold',
                                    'normal')

class ChannelItem {
  constructor(parent, channel) {
    this.parent = parent
    this.channel = channel
    this.subscription = {
      onUpdateReadState: channel.onUpdateReadState.add(this.update.bind(this)),
    }

    this.hover = false
    this.isSelected = false

    this.view = gui.Container.create()
    this.view.setMouseDownCanMoveWindow(false)
    this.view.setStyle({height: defaultFont.getSize() + 12 })
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
    this.subscription.onUpdateReadState.detach()
  }

  select() {
    this.isSelected = true
    this.view.schedulePaint()
  }

  deselect() {
    this.isSelected = false
    this.channel.deselect()
    this.view.schedulePaint()
  }

  update() {
    this.view.schedulePaint()
  }

  draw(view, painter, dirty) {
    const bounds = view.getBounds()
    const attributes = {color: NORMAL_COLOR, valign: 'center'}
    if (this.isSelected) {
      attributes.color = SELECTED_COLOR
      painter.setFillColor(SELECTED_BACKGROUND)
      painter.fillRect(Object.assign(bounds, {x: 0, y: 0}))
    } else if (this.hover) {
      painter.setFillColor(HOVER_BACKGROUND)
      painter.fillRect(Object.assign(bounds, {x: 0, y: 0}))
    }
    if (!this.channel.isRead) {
      attributes.font = UNREAD_FONT
      attributes.color = SELECTED_COLOR
    }
    const textRect = Object.assign(bounds, {x: PADDING, y: 0})
    const prefix = this.channel.isPrivate ? 'θ' : '#'
    painter.drawText(prefix + ' ' + this.channel.name, textRect, attributes)
  }
}

module.exports = ChannelItem
