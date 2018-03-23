const path = require('path')

const Service = require('../../model/service')
const SlackAccount = require('./slack-account')
const SlackChannel = require('./slack-channel')

class SlackService extends Service {
  constructor() {
    super('slack', 'Slack', SlackAccount, SlackChannel)
  }

  login(callback) {
    callback(null, new SlackAccount(this))
  }
}

module.exports = new SlackService
