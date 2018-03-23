const Channel = require('../../model/channel')

class SlackChannel extends Channel {
  constructor(config=null) {
    if (config) {
      super(config)
      return
    }

    super({id: 'ttt', name: 'ttt'})
  }

  serialize() {
    return super.serialize()
  }

  static deserialize(config) {
    return new SlackChannel(config)
  }
}

module.exports = SlackChannel
