const Reaction = require('../../model/reaction')

const {parseEmoji} = require('./message-parser')

class SlackReaction extends Reaction {
  constructor(account, name, count, userIds) {
    super(name, count, parseEmoji(account, 16, name))
    if (userIds.includes(account.currentUserId))
      this.reacted = true
  }
}

module.exports = SlackReaction
