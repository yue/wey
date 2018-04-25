const gui = require('gui')

const ChatWindow = require('./chat-window')
const ChannelExit = require('./channel-exit')

const NORMAL_COLOR = '#C1C2C6'
const SELECTED_COLOR = '#FFFFFF'
const DISABLED_COLOR = '#8B8D94'
const HOVER_BACKGROUND = '#2B2E3B'
const SELECTED_BACKGROUND = '#6798A2'
const PADDING = 10

const ITEM_HEIGHT = gui.Font.default().getSize() + 12
const UNREAD_FONT = gui.Font.default().derive(0, 'bold', 'normal')

const MENTIONS_WIDTH = 8
const MENTIONS_RADIUS = ITEM_HEIGHT - 10
const MENTIONS_COLOR = '#FFFFFF'
const MENTIONS_BACKGROUND = '#DC5960'

const PRESENCE_COLOR = '#9FEAF9'
const PRESENCE_PADDING = 3
const PRESENCE_RADIUS = 4

class ChannelItem {
  constructor(parent, channel) {
    this.parent = parent
    this.channel = channel
    this.subscription = {
      onUpdateReadState: channel.onUpdateReadState.add(this.update.bind(this)),
      onUpdateAwayState: channel.onUpdateAwayState.add(this.update.bind(this)),
      onUpdateMentions: channel.onUpdateMentions.add(this.update.bind(this)),
    }

    if (channel.type === 'channel')
      this.title = (channel.isPrivate ? 'θ' : '#') + ' ' + channel.name
    else
      this.title = channel.name

    this.hover = false
    this.isSelected = false
    this.disabled = false

    this.view = gui.Container.create()
    this.view.setMouseDownCanMoveWindow(false)
    this.view.setStyle({height: ITEM_HEIGHT})
    this.view.onDraw = this.draw.bind(this)
    this.view.onMouseEnter = () => {
      this.hover = true
      if (this.channelExit && this.channel.mentions === 0)
        this.channelExit.view.setVisible(true)
      this.view.schedulePaint()
    }
    this.view.onMouseLeave = () => {
      this.hover = false
      if (this.channelExit)
        this.channelExit.view.setVisible(false)
      this.view.schedulePaint()
    }
    this.view.onMouseUp = this.click.bind(this)
    if (this.channel.type === 'dm') {
      this.channelExit = new ChannelExit()
      this.channelExit.view.setVisible(false)
      this.channelExit.view.onMouseUp = this.clickExit.bind(this)
      this.view.addChildView(this.channelExit.view)
    }
  }

  unload() {
    this.subscription.onUpdateReadState.detach()
    this.subscription.onUpdateAwayState.detach()
    this.subscription.onUpdateMentions.detach()
  }

  select() {
    if (this.isSelected)
      return
    this.isSelected = true
    this.view.schedulePaint()
  }

  deselect() {
    if (!this.isSelected)
      return
    this.isSelected = false
    this.view.schedulePaint()
  }

  update() {
    this.view.schedulePaint()
  }

  draw(view, painter, dirty) {
    const bounds = view.getBounds()
    const attributes = {color: NORMAL_COLOR, valign: 'center'}
    let padding = PADDING
    if (this.channel.type === 'dm')
      padding += PRESENCE_RADIUS * 2 + PRESENCE_PADDING + 1
    // Background color.
    if (this.isSelected) {
      painter.setFillColor(SELECTED_BACKGROUND)
      painter.fillRect(Object.assign(bounds, {x: 0, y: 0}))
    } else if (this.hover) {
      painter.setFillColor(HOVER_BACKGROUND)
      painter.fillRect(Object.assign(bounds, {x: 0, y: 0}))
    }
    // Text font and color.
    if (this.isSelected) {
      attributes.color = SELECTED_COLOR
    } else if (this.disabled) {
      attributes.color = DISABLED_COLOR
    } else if (this.channel.isMuted) {
      attributes.color = DISABLED_COLOR
    } else if (!this.channel.isRead) {
      attributes.font = UNREAD_FONT
      attributes.color = SELECTED_COLOR
    }
    // Draw channel title.
    const mentionsRadius = (bounds.height - 8) / 2
    const textRect = {
      x: padding,
      y: 0,
      width: bounds.width - padding - PADDING - MENTIONS_WIDTH - 2 * mentionsRadius,
      height: bounds.height,
    }
    if (process.platform === 'darwin')
      textRect.height -= 3
    else if (process.platform === 'linux')
      textRect.height -= 1
    painter.drawText(this.title, textRect, attributes)
    // Draw mentions count.
    if (this.channel.mentions > 0)
      this.drawMentionsCount(painter, mentionsRadius, padding + textRect.width, bounds.height, textRect.height)
    // Draw presence indicator.
    if (this.channel.type === 'dm')
      this.drawPresenceIndicator(painter, bounds, attributes)
  }

  drawMentionsCount(painter, radius, x, height, textHeight) {
    painter.beginPath()
    painter.setLineWidth(1)
    painter.arc({x: x + radius, y: height / 2}, radius, Math.PI / 2, -Math.PI / 2)
    painter.arc({x: x + radius + MENTIONS_WIDTH, y: height / 2}, radius, -Math.PI / 2, Math.PI / 2)
    painter.setFillColor(MENTIONS_BACKGROUND)
    painter.fill()
    const rect = {x: x + radius, y: 0, width: MENTIONS_WIDTH, height: textHeight}
    const attributes = {color: MENTIONS_COLOR, align: 'center', valign: 'center'}
    painter.drawText(String(this.channel.mentions), rect, attributes)
  }

  drawPresenceIndicator(painter, bounds, attributes) {
    const arcPos = {x: PADDING + PRESENCE_RADIUS + 1, y: bounds.height / 2}
    if (process.platform === 'win32')
      arcPos.x += 2
    painter.beginPath()
    painter.setLineWidth(1)
    painter.arc(arcPos, PRESENCE_RADIUS - (this.channel.isAway ? 0.5 : 0), 0, 2 * Math.PI)
    if (this.channel.isAway) {
      painter.setStrokeColor(attributes.color)
      painter.stroke()
    } else {
      if (this.channel.isMultiParty)
        painter.setFillColor(attributes.color)
      else
        painter.setFillColor(PRESENCE_COLOR)
      painter.fill()
    }
  }

  click(view, event) {
    if (event.button === 1) {
      // Left click to open channel.
      this.parent.selectChannelItem(this)
    } else {  // for GTK+ button could be 3 for trackpad right click.
      // Right click to show context menu.
      if (!this.menu) {
        if (this.channel.type === 'channel') {
          this.menu = gui.Menu.create([
            { label: 'Popup to new window', onClick: this.popup.bind(this) },
            { label: 'Leave channel', onClick: this.leave.bind(this) },
          ])
        } else {
          this.menu = gui.Menu.create([
            { label: 'Popup to new window', onClick: this.popup.bind(this) },
          ])
        }
      }
      this.menu.popup()
    }
  }

  clickExit(view, event) {
    if (event.button === 1)
      this.leave()
    return true
  }

  popup() {
    const bounds = this.parent.mainWindow.chatBox.view.getBounds()
    new ChatWindow(this.parent.account, this.channel, bounds)
  }

  close() {
    this.disabled = true
    this.update()
    this.parent.account.close(this.channel)
  }

  leave() {
    this.disabled = true
    this.update()
    this.parent.account.leave(this.channel)
  }
}

module.exports = ChannelItem
