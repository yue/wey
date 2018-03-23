const Account = require('../../model/account')
const SlackChannel = require('./slack-channel')

class SlackAccount extends Account {
  constructor(service, config=null) {
    if (config) {
      super(service, config)
      return
    }

    super(service, {id: 'ttt', name: 'ttt'})
  }

  serialize() {
    return super.serialize()
  }

  static deserialize(service, config) {
    return new SlackAccount(service, config)
  }
}

module.exports = SlackAccount
