const User = require('../../model/user')

class SlackUser extends User {
  constructor(member) {
    const displayName = member.profile.display_name
    super(member.id, displayName ? displayName : member.name, member.profile.image_72)
    this.color = member.color
    this.isBot = member.is_bot
    this.isAway = true
  }

  setAway(isAway) {
    this.isAway = isAway
  }
}

module.exports = SlackUser
