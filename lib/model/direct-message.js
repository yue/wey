const Signal = require('mini-signals')
const MessageList = require('./message-list')

class DirectMessage extends MessageList {
  constructor(account, id, name) {
    super(account, 'dm', id)
    this.name = name
    this.userId = null
    this.isMultiParty = false
    this.isAway = false

    this.onUpdateAwayState = new Signal()
  }

  setAway(isAway) {
    if (this.isAway !== isAway) {
      this.isAway = isAway
      this.onUpdateAwayState.dispatch()
    }
  }

  markRead() {
    super.markRead()
    if (!this.account.isRead) {
      this.account.updateReadState()
      this.account.updateMentions()
    }
  }

  async dispatchMessage(message) {
    await super.dispatchMessage(message)
    if (!this.isDisplaying) {
      this.account.setReadState(false)
      this.account.updateMentions()
    }
  }
}

module.exports = DirectMessage
