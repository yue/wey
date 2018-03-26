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
    if (channel.unread_count)
      this.isRead = false
    this.account = account
    // Whether we need to fetch messages before reading.
    this.messagesReady = false
  }

  async readMessages() {
    if (this.messagesReady)
      return this.messages
    this.isReceiving = true
    try {
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
    } finally {
      this.isReceiving = false
    }
    return this.messages
  }

  async sendMessage(message) {
    const res = await this.account.rtm.sendMessage(message, this.id)
    const event = {
      user: this.account.currentUserId,
      text: message,
      ts: res.ts,
    }
    this.dispatchMessage(new SlackMessage(this.account, event))
  }
}

module.exports = SlackChannel
