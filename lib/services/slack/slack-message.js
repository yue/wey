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
    this.text = slackMarkdownToHtml(this.text)
    if (!this.user) {
      this.user = new User(userId, '<unkown>', '')
      this.pendingUser = userId
    }
  }

  async fetchUser(rtm, account) {
    if (!this.pendingUser)
      return
    let member
    if (this.isBot) {
      const {bot} = await rtm.webClient.bots.info({bot: this.pendingUser})
      member = bot
      // Slack's API is inconsistent for bot users.
      member.is_bot = true
      member.profile = member.icons
    } else {
      const {user} = await rtm.webClient.users.info({user: this.pendingUser})
      member = user
    }
    delete this.pendingUser
    this.user = new SlackUser(member)
    // Cache the result.
    account.users[this.user.id] = this.user
  }
}

module.exports = SlackMessage
