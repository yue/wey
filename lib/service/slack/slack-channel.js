const bounds = require('binary-search-bounds')

const Channel = require('../../model/channel')
const SlackMessage = require('./slack-message')

class SlackChannel extends Channel {
  constructor(account, type, channel) {
    super(account, type, channel.id, channel.name)
    switch (type) {
      case 'channel':
        if (channel.is_open === undefined) {
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
          this.name = this.name.replace(`-${account.currentUserName}-`, '')
          this.name = this.name.substring(this.name.indexOf('-') + 1, this.name.lastIndexOf('-')).split('--').join(', ')
        } else {
          this.userId = channel.user_id
          if (this.userId === account.currentUserId)
            this.name = `${this.name} (you)`
          const user = account.findUserById(channel.user_id)
          if (user)
            this.isAway = user.isAway
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
    if (channel.is_muted)
      this.isMuted = true
  }

  async readMessagesImpl() {
    // Read messages.
    const options = {channel: this.id}
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
    const options = {
      channel: this.id,
      ts: this.latestTs,
    }
    if (this.type === 'channel') {
      if (this.isPrivate)
        await this.account.rtm.webClient.groups.mark(options)
      else
        await this.account.rtm.webClient.channels.mark(options)
    } else if (this.type === 'dm') {
      if (this.isMultiParty)
        await this.account.rtm.webClient.mpim.mark(options)
      else
        await this.account.rtm.webClient.im.mark(options)
    }
  }
}

module.exports = SlackChannel
