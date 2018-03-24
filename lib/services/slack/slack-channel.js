const Channel = require('../../model/channel')

class SlackChannel extends Channel {
  constructor(channel) {
    super(channel.id, channel.name)
    if (channel.is_channel) {
      this.isMember = channel.is_member
    } else if (channel.is_group) {
      this.isMember = channel.is_open
      this.isPrivate = true
    }
  }
}

module.exports = SlackChannel
