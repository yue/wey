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
    this.account = account
    this.rtm = account.rtm
    this.messagesRead = false
  }

  async readMessages() {
    if (this.messagesRead)
      return this.messages
    const options = {channel: this.id}
    if (this.messages.length > 0)
      options.latest = this.messages[0].timestamp
    const {messages} = this.isChannel ? await this.rtm.webClient.channels.history(options)
                                      : await this.rtm.webClient.groups.history(options)
    if (this.messagesRead)  // we might have 2 readMessages in parallel
      return this.messages
    const smsgs = messages.reverse().map((m) => new SlackMessage(this.account, m))
    for (const m of smsgs)
      await m.fetchPendingInfo(this.account)
    this.messages = this.foldMessages(smsgs).concat(this.messages)
    this.messagesRead = true
    return this.messages
  }

  async sendMessage(message) {
    const options = {channel: this.id, text: message, as_user: true}
    return await this.rtm.webClient.chat.postMessage(options)
  }
}

module.exports = SlackChannel
