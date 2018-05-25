const Thread = require('../../model/thread')
const SlackMessage = require('./slack-message')

class SlackThread extends Thread {
  constructor(channel, id) {
    super(channel, id)
  }

  async setMessageStar(id, timestamp, hasStar) {
    super.setMessageStar(id, timestamp, hasStar, this.channel.id)
  }

  async setMessageReaction(id, timestamp, name, reacted) {
    super.setMessageReaction(id, timestamp, name, reacted, this.channel.id)
  }

  async readMessagesImpl() {
    // Read messages.
    const options = {channel: this.channel.id, ts: this.id, limit: 50}
    const {messages} = await this.account.rtm.webClient.conversations.replies(options)
    // Converting messages.
    const smsgs = messages.map((m) => new SlackMessage(this.account, m))
    for (const m of smsgs)  // slack messages have async info.
      await m.fetchPendingInfo(this.account)
    return smsgs
  }

  async sendMessage(text) {
    const options = {text, channel: this.channel.id, thread_ts: this.id}
    const res = await this.account.rtm.addOutgoingEvent(true, 'message', options)
    const event = {
      user: this.account.currentUserId,
      text: text,
      ts: res.ts,
      thread_ts: this.id,
    }
    const message = new SlackMessage(this.account, event)
    await message.fetchPendingInfo(this.account)
    this.dispatchMessage(message)
  }

  async notifyReadImpl() {
    // Slack does not seem to have an API to mark thread as read.
  }
}

module.exports = SlackThread
