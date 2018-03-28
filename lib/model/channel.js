const Signal = require('mini-signals')

const STOP_RECEIVING_TIMEOUT = 60 * 60 * 1000  // 1 hour
const MARK_TIMEOUT = 5 * 1000  // 5 seconds

const CACHE_MESSAGES_LIMIT = 300

class Channel {
  constructor(id, name) {
    this.id = id
    this.name = name

    this.messages = []
    this.isMember = false
    this.isPrivate = false
    this.isDefault = false

    // Whether all messages of channel have been read.
    this.isRead = true

    // Timstamp of last main message, the |messages| may have sub messages.
    this.lastTimestamp = null

    // Whether channel is being displayed.
    this.isDisplaying = false
    this.viewerCount = 0

    // Whether channel is receiving messages.
    this.isReceiving = false

    // Whether we need to fetch messages before reading.
    this.messagesReady = false

    // Timeout for stop receiving.
    this.stopTimer = null

    // Timeout for sending mark information.
    this.markTimer = null

    this.onMessage = new Signal()
    this.onDeleteMessage = new Signal()
    this.onModifyMessage = new Signal()
    this.onUpdateReadState = new Signal()
  }

  markRead() {
    if (this.isRead)
      return
    this.isRead = true
    this.onUpdateReadState.dispatch()
  }

  markUnread() {
    if (!this.isRead || this.isDisplaying)
      return
    this.isRead = false
    this.onUpdateReadState.dispatch()
  }

  select() {
    this.viewerCount++
    this.isDisplaying = true
    this.startReceiving()
    if (this.messagesReady)
      this.markRead()
  }

  deselect() {
    if (--this.viewerCount == 0) {
      this.isDisplaying = false
      this.stopTimer = setTimeout(this.stopReceiving.bind(this),
                                  STOP_RECEIVING_TIMEOUT)
    }
  }

  startReceiving() {
    this.isReceiving = true
    if (this.stopTimer) {
      clearTimeout(this.stopTimer)
      this.stopTimer = null
    }
  }

  stopReceiving() {
    this.isReceiving = false
    this.stopTimer = null
    this.clear()
  }

  clear() {
    this.messagesReady = false
    this.messages = []
  }

  // Compute day markers and whether messages should be folded.
  foldMessages(messages) {
    for (const i in messages) {
      if (i == 0) {
        messages[i].setDayMarker()
        continue
      }
      this.compareMessage(messages[i], messages[i - 1])
    }
    return messages
  }

  compareMessage(m, pm) {
    if (m.user.id == pm.user.id &&
        m.date.getTime() - pm.date.getTime() < 5 * 60 * 1000)
      m.isFolded = true
    if (m.date.getDate() != pm.date.getDate())
      m.setDayMarker()
  }

  findMessageIndex(id, timestamp) {
    if (this.messages.length == 0)
      return -1
    for (let i = this.messages.length - 1; i > 0; --i) {
      const message = this.messages[i]
      if (message.id == id)
        return i
      if (message.timestamp < timestamp)
        return -1
    }
    return -1
  }

  dispatchMessage(message) {
    // Handled read state.
    if (this.isDisplaying)
      this.notifyRead()
    else
      this.markUnread()
    // Only store messages when necessary.
    if (!this.isReceiving)
      return
    // Handle thew new message.
    if (this.messages.length > 0)
      this.compareMessage(message, this.messages[this.messages.length - 1])
    if (!message.isSub)
      this.lastTimestamp = message.timestamp
    this.messages.push(message)
    // Limit the size of cached messages, remove many items to avoid calling
    // splice too often.
    if (this.messages.length > CACHE_MESSAGES_LIMIT) {
      this.messages.splice(0, 50)
      this.messages[0].setDayMarker()
    }
    // Dispatch the message.
    this.onMessage.dispatch(message)
  }

  deleteMessage(id, timestamp) {
    if (!this.isReceiving)
      return
    const i = this.findMessageIndex(id, timestamp)
    if (i !== -1) {
      this.messages.splice(i, 1)
      this.onDeleteMessage.dispatch(id, timestamp)
    }
  }

  modifyMessage(id, timestamp, text) {
    if (!this.isReceiving)
      return
    const i = this.findMessageIndex(id, timestamp)
    if (i !== -1) {
      this.messages[i].text = text
      this.onModifyMessage.dispatch(id, timestamp, text)
    }
  }

  async readMessages() {
    throw new Error('Should be implemented by subclasses')
  }

  async sendMessage(message) {
    throw new Error('Should be implemented by subclasses')
  }

  async notifyRead() {
    this.markRead()
    if (this.messages.length == 0)
      return
    if (this.markTimer)
      clearTimeout(this.markTimer)
    this.markTimer = setTimeout(this._notifyReadImpl.bind(this), MARK_TIMEOUT)
  }

  async _notifyReadImpl() {
    throw new Error('Should be implemented by subclasses')
  }
}

module.exports = Channel
