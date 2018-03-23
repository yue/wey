const {RTMClient} = require('@slack/client')

const Account = require('../../model/account')
const SlackChannel = require('./slack-channel')

class SlackAccount extends Account {
  constructor(service, team, rtm, config=null) {
    if (config) {
      super(service, config)
      this.rtm = new RTMClient(config.token)
      this.rtm.once('unable_to_rtm_start', this.onError.bind(this))
      this.rtm.once('error', this.onError.bind(this))
      this.rtm.once('ready', () => {
        this.onReady().catch(this.onError.bind(this))
      })
      this.rtm.start()
    } else {
      super(service, {id: team.id, name: team.name})
      this.rtm = rtm
      this.rtm.once('error', this.onError.bind(this))
      this.onReady().catch(this.onError.bind(this))
    }
  }

  serialize() {
    const config = {
      token: this.rtm.webClient.token,
    }
    return Object.assign(super.serialize(), config)
  }

  static deserialize(service, config) {
    return new SlackAccount(service, null, null, config)
  }

  async onReady() {
    const {channels} = await this.rtm.webClient.channels.list()
  }

  onError(error) {
    // TODO Show error box and disconnect
    console.error(error)
  }
}

module.exports = SlackAccount
