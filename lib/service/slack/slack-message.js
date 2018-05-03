const User = require('../../model/user')
const Message = require('../../model/message')
const SlackAttachment = require('./slack-attachment')
const SlackReaction = require('./slack-reaction')
const SlackUser = require('./slack-user')

const {slackMarkdownToHtml} = require('./message-parser')

class SlackMessage extends Message {
  constructor(account, event) {
    let userId = event.user
    let timestamp = event.ts
    switch (event.subtype) {
      case 'file_comment':
        timestamp = event.comment.timestamp
        userId = event.comment.user
        break
      case 'bot_message':
        userId = event.bot_id
        break
    }
    super(timestamp, event.text, timestamp)
    switch (event.subtype) {
      case 'file_comment':
        this.isSub = true
        break
      case 'bot_message':
        this.isBot = true
        break
    }
    if (event.attachments)
      this.attachments = event.attachments.map((att) => new SlackAttachment(account, att))
    if (event.edited && !this.isBot)
      this.isEdited = true
    if (event.reactions)
      this.reactions = event.reactions.map((r) => new SlackReaction(account, r.name, r.count))
    if (event.thread_ts === event.ts) {
      this.isThreadParent = true
      this.replyCount = event.reply_count
      this.replyUsers = event.replies.reduce((a, r) => {
        if (!a.includes(r.user))
          a.push(r.user)
        return a
      }, []).slice(0, 3)
    }
    if (event.thread_ts && event.thread_ts !== event.ts) {
      this.isSub = true
      this.threadId = event.thread_ts
    }
    this.user = account.findUserById(userId)
    if (!this.user) {
      this.user = new User(userId, '<unkown>', '')
      this.pendingUser = userId
    }
  }

  async fetchPendingInfo(account) {
    if (this.text)
      [this.hasMention, this.text] = await slackMarkdownToHtml(account, this.text)
    if (this.pendingUser) {
      this.user = await account.fetchUser(this.pendingUser, this.isBot)
      delete this.pendingUser
    }
    if (this.replyUsers) {
      for (let i in this.replyUsers)
        this.replyUsers[i] = await account.fetchUser(this.replyUsers[i], false)
    }
  }
}

module.exports = SlackMessage
