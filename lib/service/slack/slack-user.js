const User = require('../../model/user')

const {parseEmoji} = require('./message-parser')

function normalizeStatusEmoji(statusEmoji) {
  return statusEmoji.substr(1, statusEmoji.length - 2)
}

class SlackUser extends User {
  constructor(account, member) {
    const displayName = member.profile.display_name
    super(member.id, displayName ? displayName : member.name, member.profile.image_72)
    this.isBot = member.is_bot
    this.isAway = true
    const statusEmoji = member.profile.status_emoji
    if (statusEmoji)
      this.statusEmoji = parseEmoji(account, 16, normalizeStatusEmoji(statusEmoji))
  }

  setAway(isAway) {
    this.isAway = isAway
  }
}

module.exports = SlackUser
