const User = require('../../model/user')
const Message = require('../../model/message')
const SlackUser = require('./slack-user')

class SlackMessage extends Message {
  constructor(account, event) {
    super(event.text, event.ts)
    this.user = account.findUserById(event.user)
    // TODO Fetch the user when necessary.
    if (!this.user)
      this.user = new User(event.user, '<unkown>', '')
  }
}

module.exports = SlackMessage
