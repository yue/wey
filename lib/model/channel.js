const Signal = require('mini-signals')
const MessageList = require('./message-list')

class Channel extends MessageList {
  constructor(account, type, id, name) {
    super(account)
    this.type = type
    this.id = id
    this.name = name
    this.description = '(No description)'

    this.isMember = false
    this.isPrivate = false
    this.isDefault = false
    this.isMultiParty = false
    this.isMuted = false
    this.isAway = false

    this.openedThreads = []

    this.onUpdateAwayState = new Signal()
  }

  setAway(isAway) {
    this.isAway = isAway
    this.onUpdateAwayState.dispatch()
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
    // Update account's read state.
    this.account.updateMentions()
    if (!this.account.isRead)
      this.account.setReadState(this.account.computeReadState())
  }

  markUnread() {
    super.markUnread()
    // Update account's read state.
    if (!this.isMuted && this.account.isRead)
      this.account.setReadState(false)
  }

  async dispatchMessage(message) {
    const oldMentions = this.mentions
    await super.dispatchMessage(message)
    // Update account's mentions.
    if (this.mentions !== oldMentions)
      this.account.updateMentions()
  }
}

module.exports = Channel
