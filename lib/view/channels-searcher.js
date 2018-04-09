const gui = require('gui')

const ITEM_HEIGHT = 50
const SEPARATOR_COLOR = '#E8E8E8'
const FOCUS_BACKGROUND = '#ECF5FB'
const PADDING = 5

const NAME_FONT = gui.Font.default().derive(0, 'bold', 'normal')
const DESP_FONT = gui.Font.default().derive(2, 'normal', 'normal')

class ChannelsSearcher {
  constructor(mainWindow) {
    this.mainWindow = mainWindow
    this.channels = []

    this.view = gui.Container.create()
    this.view.setMouseDownCanMoveWindow(false)
    this.view.setBackgroundColor('#FFF')
    this.view.setStyle({flex: 1, padding: 20})

    this.entry = gui.Entry.create()
    this.entry.setStyle({width: '100%', marginBottom: 20})
    this.entry.onTextChange = this.onTextChange.bind(this)
    this.view.addChildView(this.entry)

    this.scroll = gui.Scroll.create()
    this.scroll.setStyle({flex: 1})
    this.scroll.setScrollbarPolicy('never', 'automatic')
    this.contentView = gui.Container.create()
    this.contentView.onDraw = this.draw.bind(this)
    this.scroll.setContentView(this.contentView)
    this.view.addChildView(this.scroll)

    this.hoverItem = null
    this.contentView.onMouseMove = this.onMouse.bind(this)
    this.contentView.onMouseEnter = this.onMouse.bind(this)
    this.contentView.onMouseLeave = this.onMouse.bind(this)
    this.contentView.onMouseUp = this.onClick.bind(this)
  }

  unload() {
    this.entry.setText('')
    this.account = null
    this.allChannels = []
    this.channels = []
    this.view.setVisible(false)
    this.updateSize()
  }

  loadChannels(account, channels) {
    this.account = account
    this.allChannels = channels
    this.channels = channels
    this.view.setVisible(true)
    this.entry.focus()
    this.updateSize()
  }

  applyFilter(filter) {
    this.channels = this.allChannels.filter(filter)
    this.updateSize()
  }

  updateSize() {
    this.scroll.setContentSize({
      width: this.scroll.getBounds().width,
      height: this.channels.length * ITEM_HEIGHT,
    })
  }

  draw(view, painter, dirty) {
    const width = view.getBounds().width
    const start = Math.floor(dirty.y / ITEM_HEIGHT)
    const end = Math.floor(dirty.y + dirty.height / ITEM_HEIGHT)
    for (let i = start; i <= end; ++i) {
      const channel = this.channels[i]
      if (!channel)
        break
      // Focus ring.
      if (i === this.hoverItem) {
        painter.setColor(FOCUS_BACKGROUND)
        painter.fillRect({x: 0, y: i * ITEM_HEIGHT, width, height: ITEM_HEIGHT})
      }
      // Draw name.
      const bounds = {
        x: PADDING,
        y: i * ITEM_HEIGHT + PADDING,
        width: width - PADDING * 2,
        height: 20
      }
      const prefix = channel.isPrivate ? 'θ' : '#'
      painter.drawText(prefix + ' ' + channel.name, bounds, {font: NAME_FONT})
      // Description.
      bounds.y += 20
      painter.drawText(channel.description, bounds, {font: DESP_FONT})
      // Seperator.
      if (i !== this.channels.length - 1) {
        const y = (i + 1) * ITEM_HEIGHT
        painter.setStrokeColor(SEPARATOR_COLOR)
        painter.beginPath()
        painter.moveTo({x: 0, y})
        painter.lineTo({x: width, y})
        painter.stroke()
      }
    }
  }

  onMouse(view, event) {
    const hover = Math.floor(event.positionInView.y / ITEM_HEIGHT)
    if (this.hoverItem === hover)
      return
    const rect = {x: 0, y: 0, width: view.getBounds().width, height: ITEM_HEIGHT}
    if (this.hoverItem !== null)
      this.contentView.schedulePaintRect(Object.assign(rect, {y: this.hoverItem * ITEM_HEIGHT}))
    this.hoverItem = hover
    this.contentView.schedulePaintRect(Object.assign(rect, {y: this.hoverItem * ITEM_HEIGHT}))
  }

  onClick(view, event) {
    const i = Math.floor(event.positionInView.y / ITEM_HEIGHT)
    const channel = this.channels[i]
    if (channel) {
      if (this.account.findChannelById(channel.id)) {
        // Focus on the channel when already joined.
        this.mainWindow.channelsPanel.selectChannelById(channel.id)
      } else {
        // Join and wait.
        this.mainWindow.setLoading()
        this.account.join(channel)
      }
    }
  }

  onTextChange(view) {
    const text = view.getText()
    this.applyFilter((c) => c.name.includes(text) || c.description.includes(text))
  }
}

module.exports = ChannelsSearcher
