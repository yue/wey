const User = require('../../model/user')
const Message = require('../../model/message')
const SlackUser = require('./slack-user')

const slackMarkdownToHtml = require('./message-parser')

class SlackMessage extends Message {
  constructor(account, event) {
    let userId = event.user
    if (event.subtype == 'file_comment') {
      super(event.text, event.comment.timestamp)
      userId = event.comment.user
    } else if (event.subtype == 'bot_message') {
      super(event.text, event.ts)
      this.isBot = true
      userId = event.bot_id
    } else {
      super(event.text, event.ts)
    }
    this.user = account.findUserById(userId)
    if (!this.user) {
      this.user = new User(userId, '<unkown>', '')
      this.pendingUser = userId
    }
  }

  async fetchPendingInfo(account) {
    this.text = await slackMarkdownToHtml(account, this.text)
    if (this.pendingUser) {
      this.user = await account.fetchUser(this.pendingUser, this.isBot)
      delete this.pendingUser
    }
  }
}

module.exports = SlackMessage
