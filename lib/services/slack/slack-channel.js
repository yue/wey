const Channel = require('../../model/channel')

class SlackChannel extends Channel {
  constructor(rtm, channel, config=null) {
    if (config) {
      super(config)
    } else {
      super({id: channel.id, name: channel.name})
    }
    this.rtm = rtm
  }

  serialize() {
    return super.serialize()
  }

  static deserialize(config) {
    return new SlackChannel(null, null, config)
  }
}

module.exports = SlackChannel
