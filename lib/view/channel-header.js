const gui = require('gui')

const {theme} = require('../controller/theme-manager')

class ChannelHeader {
  constructor() {
    this.channel = null
    this.channelTitle = ''

    this.view = gui.Container.create()
    this.view.setStyle({height: theme.channelHeader.height})
    this.view.setBackgroundColor(theme.channelHeader.backgroundColor)
    this.view.onDraw = this.draw.bind(this)
  }

  unload() {
    this.channel = null
  }

  loadChannel(channel) {
    this.channel = channel
    if (channel.type === 'channel')
      this.channelTitle = (channel.isPrivate ? 'θ' : '#') + ' ' + channel.name
    else
      this.channelTitle = channel.name
    this.view.setVisible(!!this.channelTitle)
    this.view.schedulePaint()
  }

  draw(view, painter, dirty) {
    const bounds = view.getBounds()
    if (this.channel && this.channelTitle)
      this.drawChannelTitle(painter, bounds)
    else
      this.view.setVisible(false)
    this.drawBottomBorder(painter, bounds)
  }

  drawChannelTitle(painter, bounds) {
    const attributes = {
      color: theme.channelHeader.fontColor,
      font: theme.channelHeader.nameFont,
    }
    const textRect = {
      x: theme.channelHeader.paddingX,
      y: theme.channelHeader.paddingY,
      width: bounds.width,
      height: bounds.height,
    }
    painter.drawText(this.channelTitle, textRect, attributes)

    const description = this.channel.type === 'channel' ? this.channel.description : 'Private chat'
    textRect.y += attributes.font.getSize() + theme.channelHeader.paddingY
    attributes.font = theme.channelHeader.descriptionFont
    painter.drawText(description, textRect, attributes)
  }

  drawBottomBorder(painter, bounds) {
    painter.setStrokeColor(theme.channelHeader.borderColor)
    painter.beginPath()
    painter.setLineWidth(2)
    painter.moveTo({x: 0, y: bounds.height})
    painter.lineTo({x: bounds.width, y: bounds.height})
    painter.stroke()
  }
}

module.exports = ChannelHeader
