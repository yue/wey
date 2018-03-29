const Channel = require('../../model/channel')
const SlackMessage = require('./slack-message')

class SlackChannel extends Channel {
  constructor(account, channel) {
    super(channel.id, channel.name)
    if (channel.is_channel) {
      this.isChannel = true
      this.isGroup = false
      this.isMember = channel.is_member
      if (channel.is_general)
        this.isDefault = true
    } else if (channel.is_group) {
      this.isChannel = false
      this.isGroup = true
      this.isMember = channel.is_open
      this.isPrivate = true
    }
    if (channel.unread_count_display)
      this.isRead = false
    if (channel.purpose)
      this.description = channel.purpose.value
    if (!this.description)
      this.description = '(No description)'
    this.membersCount = channel.num_members
    this.account = account
  }

  async readMessages() {
    if (this.messagesReady)
      return this.messages
    // Read messages.
    const options = {channel: this.id}
    if (this.messages.length > 0)
      options.latest = this.messages[this.messages.length - 1].timestamp
    const {messages} = this.isChannel ? await this.account.rtm.webClient.channels.history(options)
                                      : await this.account.rtm.webClient.groups.history(options)
    // Converting messages.
    const smsgs = messages.reverse().map((m) => new SlackMessage(this.account, m))
    for (const m of smsgs)  // slack messages have async info.
      await m.fetchPendingInfo(this.account)
    this.messages = this.foldMessages(smsgs).concat(this.messages)
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

  async _notifyReadImpl() {
    if (!this.lastTimestamp)
      return
    // Mark the last message as read.
    const options = {
      channel: this.id,
      ts: this.lastTimestamp,
    }
    if (this.isChannel)
      await this.account.rtm.webClient.channels.mark(options)
    else
      await this.account.rtm.webClient.groups.mark(options)
  }

  async updateInfo() {
    let info
    if (this.isChannel)
      info = (await this.account.rtm.webClient.channels.info({channel: this.id})).channel
    else
      info = (await this.account.rtm.webClient.groups.info({channel: this.id})).group
    if (info.latest)
      this.lastTimestamp = info.latest.ts
    if (info.unread_count_display)
      this.markUnread()
  }
}

module.exports = SlackChannel
