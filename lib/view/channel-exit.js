const gui = require('gui')

const NORMAL_COLOR = '#C1C2C6'
const HOVER_COLOR = '#FFFFFF'
const PADDING = 10

const EXIT_RADIUS = 7
const EXIT_X_HEIGHT = 5

class ChannelExit {
  constructor() {
    this.view = gui.Container.create()
    this.view.setMouseDownCanMoveWindow(false)
    this.view.setStyle({
      position: 'absolute',
      height: 25,
      width: 16,
      right: 10,
    })
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
    const bounds = view.getBounds()
    const xPos = EXIT_RADIUS + 1;
    const arcPos = {x: xPos, y: bounds.height / 2}
    painter.setStrokeColor(this.hover ? HOVER_COLOR : NORMAL_COLOR)
    painter.beginPath()
    painter.setLineWidth(1)
    painter.arc(arcPos, EXIT_RADIUS, 0, 2 * Math.PI)
    painter.moveTo({x: xPos - (EXIT_X_HEIGHT / 2), y: PADDING})
    painter.lineTo({x: xPos + (EXIT_X_HEIGHT / 2), y: PADDING + EXIT_X_HEIGHT})
    painter.moveTo({x: xPos - (EXIT_X_HEIGHT / 2), y: PADDING + EXIT_X_HEIGHT})
    painter.lineTo({x: xPos + (EXIT_X_HEIGHT / 2), y: PADDING})
    painter.stroke()
  }
}

module.exports = ChannelExit
