const Signal = require('mini-signals')

const STOP_RECEIVING_TIMEOUT = 60 * 60 * 1000  // 1 hour
const MARK_TIMEOUT = 5 * 1000  // 5 seconds

const CACHE_MESSAGES_LIMIT = 300

class MessageList {
  constructor(account, type, id) {
    this.account = account
    this.type = type
    this.id = id
    this.messages = {}
    this.messageIds = []
    this.mentions = 0

    // Whether all messages of channel have been read.
    this.isRead = true

    // Timestamp of last read message.
    this.lastReadTs = null

    // Timestamp of first unread message.
    this.firstUnreadTs = null

    // Timestamp of last main message, the |messages| may have sub messages.
    this.latestTs = null

    // Whether channel is being displayed.
    this.isDisplaying = false
    this.viewerCount = 0

    // Whether channel is receiving messages.
    this.isReceiving = false
    this.receiverCount = 0

    // Whether we need to fetch messages before reading.
    this.messagesReady = false

    // A promised indicating the progress of current readMessages, so we won't
    // have race conditions when calling readMessages on parallel.
    this.readMessagesPromise = null

    // Timeout for stop receiving.
    this.stopTimer = null

    // Timeout for sending mark information.
    this.markTimer = null

    this.onMessage = new Signal()
    this.onDeleteMessage = new Signal()
    this.onModifyMessage = new Signal()
    this.onUpdateReadState = new Signal()
    this.onUpdateMentions = new Signal()
  }

  markRead() {
    // Clear the unread marker.
    this.lastReadTs = this.latestTs
    this.firstUnreadTs = null
    if (this.isRead)
      return
    this.isRead = true
    this.mentions = 0
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
    if (this.messagesReady)
      this.markRead()
  }

  deselect() {
    if (--this.viewerCount === 0)
      this.isDisplaying = false
  }

  startReceiving() {
    this.receiverCount++
    this.isReceiving = true
    if (this.stopTimer) {
      clearTimeout(this.stopTimer)
      this.stopTimer = null
    }
  }

  stopReceiving() {
    if (--this.receiverCount === 0)
      this.stopTimer = setTimeout(this.stopReceivingImpl.bind(this),
                                  STOP_RECEIVING_TIMEOUT)
  }

  stopReceivingImpl() {
    this.isReceiving = false
    this.stopTimer = null
    this.clear()
  }

  clear() {
    this.messagesReady = false
    this.messages = {}
    this.messageIds = []
  }

  hasMessages() {
    return !!this.messageIds[0]
  }

  latestMessage() {
    return this.messages[this.messageIds[this.messageIds.length - 1]]
  }

  findMessage(id, timestamp) {
    if (this.hasMessages()) {
      const date = new Date(timestamp * 1000)
      const message = this.messages[id]
      if (message && message.id === id && message.date >= date)
        return message
    }
    return -1
  }

  findMessage(id, timestamp) {
    const i = this.findMessageIndex(id, timestamp)
    return i === -1 ? null : this.messages[i]
  }

  async dispatchMessage(message) {
    // Update latest ts.
    if (this.latestTs * 1 < message.timestamp * 1)
      this.latestTs = message.timestamp
    // Handled read state.
    if (this.isDisplaying) {
      this.notifyRead()
      this.lastReadTs = this.latestTs
    } else {
      this.markUnread()
      if (!this.firstUnreadTs)
        this.firstUnreadTs = this.latestTs
      // New dm messages are always treated as mentions.
      if (message.hasMention || this.type === 'dm') {
        this.mentions++
        this.onUpdateMentions.dispatch()
      }
    }
    // Only store messages when necessary.
    if (!this.isReceiving) {
      // Invalidate the old stored messages.
      this.messagesReady = false
      return
    }
    // If we are in the process of reading messages, wait until it is done.
    if (this.readMessagesPromise) {
      await this.readMessagesPromise
      // Do nothing if our new message is older then received.
      if (this.hasMessages() && message.date <= this.latestMessage().date)
        return
    }
    // Handle thew new message.
    if (this.hasMessages())
      this.compareMessage(message, this.latestMessage())
    this.messageIds.push(message.id)
    // Limit the size of cached messages, remove many items to avoid calling
    // splice too often.
    if (this.messageIds.length > CACHE_MESSAGES_LIMIT) {
      this.messageIds.splice(0, 50)
      this.messages = this.messageIds.reduce((map, messageId) => {
        map[messageId] = this.messages[messageId]
        return map
      }, {})
      this.messages[this.messageIds[0]].setDayMarker()
    }
    // Dispatch the message.
    this.onMessage.dispatch(message)
  }

  findMessageAndChannels(messageId, timestamp) {
    let channels = [this];
    let message = this.findMessage(messageId, timestamp)

    if (message && message.isThreadParent && this.openedThreads) {
      // Opened threads also need to be dispatched
      for (const thread of this.openedThreads) {
        if (message = thread.findMessage(messageId, timestamp)) {
          channels.push(thread)
          break
        }
      }
    } else if (!message) {
      // Check if this reaction was added to a message in an opened thread
      for (const thread of this.openedThreads) {
        if (message = thread.findMessage(messageId, timestamp)) {
          channels = [thread]
          break
        }
      }
    }

    return { channels, message }
  }

  dispatchToAll(event, channels, messageId, data) {
    for (const channel of channels)
      channel[event].dispatch(messageId, data)
  }

  deleteMessage(messageId, timestamp) {
    if (!this.isReceiving)
      return
    const { channels, message } = this.findMessageAndChannels(messageId, timestamp)
    if (message) {
      const index = this.messageIds.indexOf(message.id)
      if (index > -1) {
        this.messageIds.splice(index, 1)
        delete this.messages[messageId]
        this.dispatchToAll('onDeleteMessage', channels, messageId, timestamp)
      }
    }
  }

  modifyMessage(id, timestamp, modified) {
    if (!this.isReceiving)
      return
    const i = this.findMessageIndex(id, timestamp)
    if (i === -1)
      return
    const original = this.messages[i]
    // Save old properties.
    const old = Object.assign({}, original)
    // Copy properties, we should NOT assign directly since it would change the
    // identity of the object.
    Object.assign(original, modified)
    // Restore some old properties.
    original.isFolded = old.isFolded
    original.isDayMarker = old.isDayMarker
    this.onModifyMessage.dispatch(id, original)
  }

  async setMessageStar(messageId, timestamp, hasStar) {
    throw new Error('Should be implemented by subclasses')
  }

  updateMessageStar(messageId, timestamp, hasStar) {
    const { channels, message } = this.findMessageAndChannels(messageId, timestamp)
    if (message && message.hasStar !== hasStar) {
      message.hasStar = hasStar
      this.dispatchToAll('onModifyMessage', channels, messageId, message)
    }
    return message
  }

  addReaction(messageId, timestamp, reaction) {
    if (!this.isReceiving)
      return

    const { channels, message } = this.findMessageAndChannels(messageId, timestamp)
    if (message) {
      const existing = message.reactions && message.reactions.find((r) => r.name === reaction.name)
      if (existing)
        ++existing.count
      else
        message.reactions.push(reaction)

      this.dispatchToAll('onModifyMessage', channels, messageId, message)
    }
  }

  removeReaction(messageId, timestamp, reaction) {
    if (!this.isReceiving)
      return
    const { channels, message } = this.findMessageAndChannels(messageId, timestamp)
    if (message) {
      const i = message.reactions.findIndex((r) => r.name === reaction.name)
      if (i === -1)
        return
      if (--message.reactions[i].count === 0) {
        message.reactions.splice(i, 1)
      }
      this.dispatchToAll('onModifyMessage', channels, messageId, message)
    }
  }

  async readMessages() {
    if (this.messagesReady)
      return this.messageIds.map(id => this.messages[id])
    // Handle parallel reads.
    if (!this.readMessagesPromise)
      this.readMessagesPromise = this.readMessagesImpl()
    const messages = await this.readMessagesPromise
    this.readMessagesPromise = null
    // Concatenate messages.
    this.messages = this.foldMessages(messages).concat(this.messages)
    // Update latestTs.
    if (!this.latestTs && this.hasMessages())
      this.latestTs = this.latestMessage().timestamp
    // Good time to collect garbages
    process.gc()
    // Mark as ready when connected and no error happened, otherwise clear the
    // messages.
    if (this.account.status === 'connected')
      this.messagesReady = true
    else {
      this.messages = {}
      this.messageIds = []
    }
    return this.messageIds.map(id => this.messages[id])
  }

  async readMessagesImpl() {
    throw new Error('Should be implemented by subclasses')
  }

  async sendMessage(message) {
    throw new Error('Should be implemented by subclasses')
  }

  async notifyRead() {
    this.markRead()
    if (this.messageIds.length === 0)
      return
    if (this.markTimer)
      clearTimeout(this.markTimer)
    this.markTimer = setTimeout(this.notifyReadImpl.bind(this), MARK_TIMEOUT)
  }

  async notifyReadImpl() {
    throw new Error('Should be implemented by subclasses')
  }

  // Compute day markers and whether messages should be folded.
  foldMessages(messages) {
    for (const i in messages) {
      if (i == 0) {
        messages[i].setDayMarker()
      else
        this.compareMessage(messages[i], messages[i - 1])

      this.messageIds.unshift(messages[i].id)
      this.messages[messages[i].id] = messages[i]
    }
    return messages
  }

  compareMessage(m, pm) {
    if (m.user.id == pm.user.id &&
        m.date.getTime() - pm.date.getTime() < 5 * 60 * 1000)
      m.isFolded = true
    if (m.date.getDate() != pm.date.getDate())
      m.setDayMarker()
    // Find out first unread message.
    if (this.lastReadTs && this.lastReadTs === pm.timestamp)
      this.firstUnreadTs = m.timestamp
  }
}

module.exports = MessageList
