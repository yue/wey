const {RTMClient} = require('@slack/client')

const Account = require('../../model/account')
const SlackMessage = require('./slack-message')
const SlackChannel = require('./slack-channel')
const SlackUser = require('./slack-user')

const imageStore = require('../../controller/image-store')

function sortChannel(a, b) {
  a = a.name.toUpperCase()
  b = b.name.toUpperCase()
  if (a < b)
    return -1
  if (a > b)
    return 1
  return 0
}

class SlackAccount extends Account {
  constructor(service, team, rtm, config=null) {
    if (config) {
      super(service, config)
      this.rtm = new RTMClient(config.token)
      this.rtm.once('unable_to_rtm_start', this.onError.bind(this))
      this.rtm.once('ready', async () => {
        const {team} = await this.rtm.webClient.team.info()
        this.onReady(team).catch(this.onError.bind(this))
      })
      this.rtm.start()
    } else {
      super(service, {id: team.id, name: team.name})
      this.rtm = rtm
      this.onReady(team).catch(this.onError.bind(this))
    }
    this.rtm.once('error', this.onError.bind(this))
    this.rtm.on('message', this.onMessage.bind(this))
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

  async onReady(team) {
    // TODO Get all users.
    // TODO Update users when new user joins.
    const {members} = await this.rtm.webClient.users.list()
    for (const m of members)
      this.users[m.id] = new SlackUser(m)
    const {channels} = await this.rtm.webClient.channels.list({exclude_members: true})
    const {groups} = await this.rtm.webClient.groups.list({exclude_members: true})
    // TODO Update channels when invited or archived.
    this.channels = channels.concat(groups).sort(sortChannel).map((c) => new SlackChannel(this, c))
    this.onUpdateChannels.dispatch(this.channels)
    this.icon = await imageStore.getImage('team', team.id, null, team.icon.image_132)
    this.onUpdateInfo.dispatch(this)
  }

  onError(error) {
    // TODO Show error box.
    console.error(error)
  }

  onMessage(event) {
    const channel = this.findChannelById(event.channel)
    if (channel)
      channel.dispatchMessage(new SlackMessage(this, event))
  }

  disconnect() {
    if (this.rtm.connected)
      this.rtm.disconnect()
  }

  findUserById(id) {
    return this.users[id]
  }
}

module.exports = SlackAccount
