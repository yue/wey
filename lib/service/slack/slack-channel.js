const Channel = require('../../model/channel')
const SlackMessage = require('./slack-message')

class SlackChannel extends Channel {
  constructor(account, channel) {
    super(account, channel.id, channel.name)
    this.isChannel = channel.is_channel
    this.isPrivate = channel.is_private
    this.isMember = channel.is_member
    this.isDefault = channel.is_general
    this.membersCount = channel.num_members
    if (channel.purpose)
      this.description = channel.purpose.value ? channel.purpose.value
                                               : '(No description)'
    if (channel.latest)
      this.lastTimestamp = channel.latest.ts
    if (channel.unread_count_display)
      this.isRead = false
  }

  async readMessages() {
    if (this.messagesReady)
      return this.messages
    // Read messages.
    const options = {channel: this.id}
    if (this.messages.length > 0)
      options.latest = this.messages[0].timestamp
    const {messages} = await this.account.rtm.webClient.conversations.history(options)
    // Converting messages.
    const smsgs = messages.reverse().map((m) => new SlackMessage(this.account, m))
    for (const m of smsgs)  // slack messages have async info.
      await m.fetchPendingInfo(this.account)
    this.messages = this.foldMessages(smsgs).concat(this.messages)
    process.gc()
    // Mark as ready when no error happens.
    this.messagesReady = true
    return this.messages
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
    if (!this.lastTimestamp)
      return
    const options = {
      channel: this.id,
      ts: this.lastTimestamp,
    }
    if (this.isChannel)
      await this.account.rtm.webClient.channels.mark(options)
    else if (this.isGroup)
      await this.account.rtm.webClient.groups.mark(options)
  }

  async updateInfo() {
    // The conversations API does not give unread information for channels, we
    // have to use the old APIs.
    let info
    if (this.isChannel)
      info = (await this.account.rtm.webClient.channels.info({channel: this.id})).channel
    else if (this.isGroup)
      info = (await this.account.rtm.webClient.groups.info({channel: this.id})).group
    else
      info = (await this.account.rtm.webClient.conversations.info({channel: this.id})).channel
    if (info.latest)
      this.lastTimestamp = info.latest.ts
    if (info.unread_count_display)
      this.markUnread()
  }
}

module.exports = SlackChannel
