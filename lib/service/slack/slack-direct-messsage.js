const DirectMessage = require('../../model/direct-message')
const SlackChannel = require('./slack-channel')
const SlackMessage = require('./slack-message')

class SlackDirectMessage extends DirectMessage {
  constructor(account, event) {
    const user = account.findUserById(event.user_id)
    super(account, event.id, user ? user.name : event.name)
    this.isMember = event.is_open
    if (event.is_mpim) {
      this.isMultiParty = true
      this.name = this.name.replace(`-${account.currentUserName}-`, '')
      this.name = this.name.substring(this.name.indexOf('-') + 1, this.name.lastIndexOf('-')).split('--').join(', ')
      this.mentions = event.mention_count_display
      // Slack does not pass has_unreads for mpim.
      this.isRead = event.unread_count_display === 0
    } else {
      this.userId = event.user_id
      if (this.userId === account.currentUserId)
        this.name = `${this.name} (you)`
      if (user)
        this.isAway = user.isAway
      this.mentions = event.dm_count
    }
    if (event.has_unreads)
      this.isRead = false
    if (event.last_read)
      this.lastReadTs = event.last_read
  }

  setMessageStar() {
    return SlackChannel.prototype.setMessageStar.apply(this, arguments)
  }

  setMessageReaction() {
    return SlackChannel.prototype.setMessageReaction.apply(this, arguments)
  }

  readMessagesImpl() {
    return SlackChannel.prototype.readMessagesImpl.apply(this, arguments)
  }

  sendMessage() {
    return SlackChannel.prototype.sendMessage.apply(this, arguments)
  }

  async notifyReadImpl() {
    if (!this.latestTs)
      return
    const options = {channel: this.id, ts: this.latestTs}
    if (this.isMultiParty)
      await this.account.rtm.webClient.mpim.mark(options)
    else
      await this.account.rtm.webClient.im.mark(options)
  }
}

module.exports = SlackDirectMessage
