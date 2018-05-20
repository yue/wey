const Channel = require('../../model/channel')
const SlackMessage = require('./slack-message')
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
    this.latestId = null
  }

  openThreadImpl(id) {
    return new SlackThread(this, id)
  }

  async setMessageStar(id, timestamp, hasStar) {
    const { channels, message } = this.findMessageAndChannels(id, timestamp)
    if (message) {
      // Slack does not send event after adding star.
      this.updateMessageStar(id, timestamp, hasStar)
      // Send message after we update the message.
      const options = {channel: this.id, timestamp: id}
      if (hasStar)
        await this.account.rtm.webClient.stars.add(options)
      else
        await this.account.rtm.webClient.stars.remove(options)
    }
  }

  async readMessagesImpl() {
    // Read messages.
    const options = {channel: this.id}
    if (this.hasMessages())
      options.latest = this.latestId

      const {messages} = await this.account.rtm.webClient.conversations.history(options)

    if (messages[0])
      this.latestId = messages[0].id

      // Converting messages.
    const pendingMessages = []
    const smsgs = messages.reduceRight((smsgs, msg) => {
      const slackMessage = new SlackMessage(this.account, msg)
      smsgs.push(slackMessage)
      pendingMessages.push(slackMessage.fetchPendingInfo(this.account))
      return smsgs
    }, [])

    await Promise.all(pendingMessages) // slack messages have async info.

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
