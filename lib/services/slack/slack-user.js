const User = require('../../model/user')

class SlackUser extends User {
  constructor(member) {
    super(member.id, member.name, member.profile.image_72)
    this.isBot = member.is_bot
  }
}

module.exports = SlackUser
