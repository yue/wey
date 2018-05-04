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

    this.onModifySubMessage = new Signal()
    this.onUpdateAwayState = new Signal()
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
    if (this.mentions !== oldMentions)
      this.account.updateMentions()
  }

  dispatchSubMessage(message) {
    this.onMessage.dispatch(message)
  }

  deleteSubMessage(id, timestamp) {
    this.onDeleteMessage.dispatch(id, timestamp)
  }

  modifySubMessage(id, timestamp, modified) {
    this.onModifySubMessage.dispatch(id, modified)
  }

  async readThread(thread) {
    throw new Error('Should be implemented by subclasses')
  }

  setAway(isAway) {
    this.isAway = isAway
    this.onUpdateAwayState.dispatch()
  }
}

module.exports = Channel
