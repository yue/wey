const Message = require('../../model/message')
const SlackUser = require('./slack-user')

class SlackMessage extends Message {
  constructor(account, event) {
    super(event.text, event.ts)
    this.user = account.findUserById(event.user)
    if (!this.user)
      this.user = new SlackUser(event.user, '<unkown>', '')
  }
}

module.exports = SlackMessage
