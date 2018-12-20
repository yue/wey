const Channel = require('../../model/channel')
const SlackMessage = require('./slack-message')
const SlackReaction = require('./slack-reaction')
const SlackThread = require('./slack-thread')

class SlackChannel extends Channel {
  constructor(account, event) {
    super(account, 'channel', event.id, event.name)
    if (event.is_open === undefined) {
      this.isMember = event.is_member
      this.isDefault = event.is_general
    } else {
      this.isMember = event.is_open
      this.isPrivate = true
    }
    this.mentions = event.mention_count_display
    if (event.has_unreads)
      this.isRead = false
    if (event.last_read)
      this.lastReadTs = event.last_read
    if (event.purpose && event.purpose.value)
      this.description = event.purpose.value
    if (event.is_muted)
      this.isMuted = true
  }

  openThreadImpl(id) {
    return new SlackThread(this, id)
  }

  async setMessageStar(id, timestamp, hasStar, channelId = this.id) {
    const message = this.findMessage(id, timestamp)
    if (message) {
      // Slack quirk: setting stars does not emit server event.
      this.updateMessageStar(id, timestamp, hasStar)
      // Send to server after updated locally.
      const options = {channel: channelId, timestamp: id}
      if (hasStar)
        await this.account.rtm.webClient.stars.add(options)
      else
        await this.account.rtm.webClient.stars.remove(options)
    }
  }

  async setMessageReaction(id, timestamp, name, reacted, channelId = this.id) {
    const message = this.findMessage(id, timestamp)
    if (message) {
      const options = {channel: channelId, timestamp: id, name}
      if (reacted)
        await this.account.rtm.webClient.reactions.add(options)
      else
        await this.account.rtm.webClient.reactions.remove(options)
    }
  }

  async readMessagesImpl() {
    // Read messages.
    const options = {channel: this.id, limit: 100}
    if (this.hasMessages())
      options.latest = this.messages[0]
    const {messages} = await this.account.rtm.webClient.conversations.history(options)
    // Converting messages.
    const smsgs = messages.reverse().map((m) => new SlackMessage(this.account, m))
    for (const m of smsgs)  // slack messages have async info.
      await m.fetchPendingInfo(this.account)
    return smsgs
  }

  async sendMessage(text) {
    const res = await this.account.rtm.sendMessage(text, this.id)
    const event = {
      user: this.account.currentUserId,
      text: text,
      ts: res.ts,
    }
    const message = new SlackMessage(this.account, event)
    await message.fetchPendingInfo(this.account)
    this.dispatchMessage(message)
  }

  async notifyReadImpl() {
    if (!this.latestTs)
      return
    const options = {channel: this.id, ts: this.latestTs}
    if (this.isPrivate)
      await this.account.rtm.webClient.groups.mark(options)
    else
      await this.account.rtm.webClient.channels.mark(options)
  }
}

module.exports = SlackChannel
