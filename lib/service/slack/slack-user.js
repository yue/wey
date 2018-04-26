const User = require('../../model/user')
const { parseEmoji } = require('./message-parser')

function normalizeStatusEmoji(statusEmoji) {
  return statusEmoji.replace(/:/g, '')
}

class SlackUser extends User {
  constructor(member, account) {
    const displayName = member.profile.display_name
    super(member.id, displayName ? displayName : member.name, member.profile.image_72)
    this.isBot = member.is_bot
    this.isAway = true
    const { status_emoji: statusEmoji } = member.profile
    if (statusEmoji) {
      this.statusEmoji = parseEmoji(account, 16, normalizeStatusEmoji(statusEmoji))
    }
  }

  setAway(isAway) {
    this.isAway = isAway
  }
}

module.exports = SlackUser
