const path = require('path')

const {RTMClient} = require('@slack/client')

const Service = require('../../model/service')
const SlackAccount = require('./slack-account')
const SlackChannel = require('./slack-channel')

class SlackService extends Service {
  constructor() {
    super('slack', 'Slack', SlackAccount, SlackChannel)
  }

  login(callback) {
    const token = process.env.SLACK_TOKEN
    if (!token)
      throw new Error('Please set SLACK_TOKEN env')
    const rtm = new RTMClient(token)
    rtm.once('unable_to_rtm_start', (error) => callback(error))
    rtm.once('ready', async () => {
      const {team} = await rtm.webClient.team.info()
      callback(null, new SlackAccount(this, team, rtm))
    })
    rtm.start()
  }
}

module.exports = new SlackService
