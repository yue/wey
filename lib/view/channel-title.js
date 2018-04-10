const gui = require('gui')

const NORMAL_COLOR = '#C1C2C6'
const HOVER_COLOR = '#FFFFFF'
const PADDING = 5

const CHANNEL_TITLE_FONT = gui.Font.default().derive(2, 'normal', 'normal')
const CHANNEL_TITLE_FONT_SIZE = CHANNEL_TITLE_FONT.getSize()

class ChannelTitle {
  constructor(title) {
    this.title = title

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
  }

  draw(view, painter, dirty) {
    const bounds = {
      x: 0,
      y: PADDING,
      height: CHANNEL_TITLE_FONT_SIZE + PADDING,
      width: view.getBounds().width,
    }
    const attributes = {
      font: CHANNEL_TITLE_FONT,
      color: this.hover ? HOVER_COLOR : NORMAL_COLOR,
    }
    painter.drawText(this.title, bounds, attributes)
  }
}

module.exports = ChannelTitle
