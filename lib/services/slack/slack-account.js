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

function filterChannel(c) {
  if (c.is_channel)
    return c.is_member
  else if (c.is_group)
    return c.is_open
  return false
}

class SlackAccount extends Account {
  constructor(service, data, rtm, config=null) {
    if (config) {
      super(service, config)
      this.rtm = new RTMClient(config.token)
      this.rtm.once('unable_to_rtm_start', this.onError.bind(this))
      this.rtm.once('authenticated', this.onReady.bind(this))
      this.rtm.start()
    } else {
      super(service, {id: data.team.id, name: data.team.name})
      this.rtm = rtm
      this.onReady(data)
    }
    this.rtm.once('error', this.onError.bind(this))
    this.rtm.on('message', this.onMessage.bind(this))
    this.rtm.on('channel_marked', this.onMarkRead.bind(this))
    this.rtm.on('group_marked', this.onMarkRead.bind(this))
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

  async onReady(data) {
    // Fetch users.
    const {members} = await this.rtm.webClient.users.list()
    for (const m of members)
      this.users[m.id] = new SlackUser(m)
    // Current user.
    this.currentUserId = data.self.id
    // Fetch channels.
    const options = {exclude_members: true, unreads: true}
    const {channels} = await this.rtm.webClient.channels.list(options)
    const {groups} = await this.rtm.webClient.groups.list(options)
    // TODO Update channels when invited or archived.
    this.channels = channels.filter(filterChannel)
                            .concat(groups.filter(filterChannel))
                            .sort(sortChannel)
                            .map((c) => new SlackChannel(this, c))
    this.onUpdateChannels.dispatch(this.channels)
    // Update current team information.
    const {team} = await this.rtm.webClient.team.info()
    this.icon = await imageStore.getImage('team', team.id, null, team.icon.image_132)
    this.onUpdateInfo.dispatch(this)
  }

  onError(error) {
    // TODO Show error box.
    console.error(error)
  }

  async onMessage(event) {
    const channel = this.findChannelById(event.channel)
    if (channel) {
      switch (event.subtype) {
        case 'message_deleted':
          channel.deleteMessage(event.deleted_ts, event.deleted_ts)
          break
        case 'message_changed':
          channel.modifyMessage(event.previous_message.ts,
                                event.previous_message.ts,
                                event.message.text)
          break
        default:
          const message = new SlackMessage(this, event)
          await message.fetchPendingInfo(this)
          channel.dispatchMessage(message)
          break
      }
    }
  }

  onMarkRead(event) {
    const channel = this.findChannelById(event.channel)
    if (channel)
      channel.markRead()
  }

  disconnect() {
    if (this.rtm.connected)
      this.rtm.disconnect()
  }

  findUserById(id) {
    return this.users[id]
  }

  async fetchUser(id, isBot) {
    const user = this.findUserById(id)
    if (user)
      return user
    let member
    if (isBot) {
      const {bot} = await this.rtm.webClient.bots.info({bot: id})
      member = bot
      // Slack's API is inconsistent for bot users.
      member.is_bot = true
      member.profile = member.icons
    } else {
      const {user} = await this.rtm.webClient.users.info({user: id})
      member = user
    }
    return this.users[id] = new SlackUser(member)
  }
}

module.exports = SlackAccount
