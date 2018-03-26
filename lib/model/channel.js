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

  async dispatchMessage(message) {
    if (!this.isSelected)
      this.isRead = false
    // TODO Limit the size of messages.
    // TODO Handle edit and delete messages.
    if (this.messages.length > 0)
      this.compareMessage(message, this.messages[this.messages.length - 1])
    this.messages.push(message)
    this.onMessage.dispatch(message)
  }

  async readMessages() {
    throw new Error('Should be implemented by subclasses')
  }

  async sendMessage(message) {
    throw new Error('Should be implemented by subclasses')
  }
}

module.exports = Channel
