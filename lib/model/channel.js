const Signal = require('mini-signals')

class Channel {
  constructor(id, name) {
    this.id = id
    this.name = name
    this.isSelected = false
    this.isRead = true
    this.isMember = false
    this.isPrivate = false
    this.isDefault = false
    this.messages = []
    this.onMessage = new Signal()
    this.onDeleteMessage = new Signal()
    this.onModifyMessage = new Signal()
    this.onMarkRead = new Signal()
  }

  markRead() {
    if (this.isRead)
      return
    this.isRead = true
    this.onMarkRead.dispatch()
  }

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
    if (!this.isSelected)
      this.isRead = false
    // TODO Limit the size of messages.
    if (this.messages.length > 0)
      this.compareMessage(message, this.messages[this.messages.length - 1])
    this.messages.push(message)
    this.onMessage.dispatch(message)
  }

  deleteMessage(id, timestamp) {
    const i = this.findMessageIndex(id, timestamp)
    if (i !== -1) {
      this.messages.splice(i, 1)
      this.onDeleteMessage.dispatch(id, timestamp)
    }
  }

  modifyMessage(id, timestamp, text) {
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
}

module.exports = Channel
