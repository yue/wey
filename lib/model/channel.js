const Signal = require('mini-signals')
const MessageList = require('./message-list')

class Channel extends MessageList {
  constructor(account, type, id, name) {
    super(account, type, id)
    this.name = name
    this.description = '(No description)'

    this.isMember = false
    this.isPrivate = false
    this.isDefault = false
    this.isMuted = false

    this.openedThreads = []
  }

  findThread(id) {
    return this.openedThreads.find((t) => t.id === id)
  }

  openThread(id) {
    const thread = this.findThread(id)
    return thread ? thread : this.openThreadImpl(id)
  }

  openThreadImpl(id) {
    throw new Error('Should be implemented by subclasses')
  }

  markRead() {
    super.markRead()
    if (!this.account.isRead) {
      this.account.updateReadState()
      this.account.updateMentions()
    }
  }

  markUnread() {
    super.markUnread()
    if (!this.isMuted && this.account.isRead)
      this.account.setReadState(false)
  }

  async dispatchMessage(message) {
    await super.dispatchMessage(message)
    if (!this.isDisplaying)
      this.account.updateMentions()
  }
}

module.exports = Channel
