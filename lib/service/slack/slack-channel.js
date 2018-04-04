const bounds = require('binary-search-bounds')

const Channel = require('../../model/channel')
const SlackMessage = require('./slack-message')

class SlackChannel extends Channel {
  constructor(account, type, channel) {
    super(account, type, channel.id, channel.name)
    switch (type) {
      case 'channel':
        if (channel.is_member !== undefined) {
          this.isMember = channel.is_member
          this.isDefault = channel.is_general
        } else {
          this.isMember = channel.is_open
          this.isPrivate = true
        }
        break
      case 'dm':
        this.isMember = channel.is_open
        if (channel.is_mpim) {
          this.isMultiParty = true
          this.name = this.name.substring(this.name.indexOf('-') + 1, this.name.lastIndexOf('-')).split('--').join(', ')
        }
        break
    }
    if (channel.has_unreads)
      this.isRead = false
    if (channel.last_read)
      this.lastReadTs = channel.last_read
    if (channel.purpose)
      this.description = channel.purpose.value ? channel.purpose.value
                                               : '(No description)'
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
    // Update latestTs.
    if (this.messages.length > 0)
      this.latestTs = this.messages[this.messages.length - 1].timestamp
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
    if (!this.latestTs)
      return
    await this.account.rtm.webClient.conversations.mark({
      channel: this.id,
      reason: 'viewed',
      ts: this.latestTs,
    })
  }
}

module.exports = SlackChannel
