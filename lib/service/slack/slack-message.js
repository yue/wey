const User = require('../../model/user')
const Message = require('../../model/message')
const SlackAttachment = require('./slack-attachment')
const SlackFile = require('./slack-file')
const SlackReaction = require('./slack-reaction')
const SlackUser = require('./slack-user')

const {slackMarkdownToHtml} = require('./message-parser')

class SlackMessage extends Message {
  constructor(account, event) {
    super(event.ts, event.text, event.ts)
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
    if (event.files)
      this.files = event.files.filter((f) => f.mode != 'tombstone').map((f) => new SlackFile(account, f))
    if (event.edited && !this.isBot)
      this.isEdited = true
    if (event.is_starred)
      this.hasStar = true
    if (event.reactions)
      this.reactions = event.reactions.map((r) => new SlackReaction(account, r.name, r.count, r.users))
    if (event.thread_ts) {
      this.threadId = event.thread_ts
      if (event.thread_ts === event.ts) {
        this.isThreadParent = true
        this.replyCount = event.reply_count
        this.replyUsers = event.reply_users
      } else {
        this.isSub = true
      }
    }

    if (event.subtype === 'bot_message' && event.username) {
      // Certain bots are not in users list.
      this.user = new SlackUser(account, event)
    } else {
      let userId = event.user
      switch (event.subtype) {
        case 'bot_message':
          userId = event.bot_id
          break
        case 'file_comment':
          userId = event.comment.user
          break
      }
      this.user = account.findUserById(userId)
      if (!this.user) {
        this.user = new User(userId, '<unknown>', '')
        this.pendingUser = userId
      }
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
