const gui = require('gui')

const NORMAL_COLOR = '#C1C2C6'
const HOVER_COLOR = '#FFFFFF'
const PADDING = 5

const CHANNEL_TITLE_FONT_SIZE = gui.Font.default().getSize() + 2
const CHANNEL_TITLE_FONT = gui.Font.create(gui.Font.default().getName(),
                                           CHANNEL_TITLE_FONT_SIZE,
                                           'normal', 'normal')

class ChannelTitle {
  constructor(parent) {
    this.view = gui.Container.create()
    this.view.setMouseDownCanMoveWindow(false)
    this.view.setStyle({height: CHANNEL_TITLE_FONT_SIZE + 2 * PADDING})
    this.view.onDraw = this.draw.bind(this)

    this.hover = false
    this.view.onMouseEnter = () => {
      this.hover = true
      this.view.schedulePaint()
    }
    this.view.onMouseLeave = () => {
      this.hover = false
      this.view.schedulePaint()
    }
    this.view.onMouseUp = parent.showAllChannels.bind(parent)
  }

  draw(view, painter, dirty) {
    const bounds = {
      x: PADDING,
      y: PADDING,
      height: CHANNEL_TITLE_FONT_SIZE + PADDING,
      width: 100,
    }
    const attributes = {
      font: CHANNEL_TITLE_FONT,
      color: this.hover ? HOVER_COLOR : NORMAL_COLOR,
    }
    painter.drawText('Channels', bounds, attributes)
  }
}

module.exports = ChannelTitle
