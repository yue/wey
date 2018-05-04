const User = require('../../model/user')

const {parseEmoji} = require('./message-parser')

function normalizeStatusEmoji(statusEmoji) {
  return statusEmoji.substr(1, statusEmoji.length - 2)
}

class SlackUser extends User {
  constructor(account, event) {
    if (event.bot_id) {
      let icon = ''
      if (event.icons) {
        if (event.icons.image_72)
          icon = event.icons.image_72
        else if (event.icons.emoji)
          icon = account.emoji[normalizeStatusEmoji(event.icons.emoji)]
      }
      super(event.bot_id, event.username, icon)
      this.isBot = true
    } else {
      const displayName = event.profile.display_name
      super(event.id, displayName ? displayName : event.name, event.profile.image_72)
      this.isBot = event.is_bot
      const statusEmoji = event.profile.status_emoji
      if (statusEmoji)
        this.statusEmoji = parseEmoji(account, 16, normalizeStatusEmoji(statusEmoji))
    }
  }

  setAway(isAway) {
    this.isAway = isAway
  }
}

module.exports = SlackUser
