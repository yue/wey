const bounds = require('binary-search-bounds')
const {RTMClient} = require('@slack/client')

const Account = require('../../model/account')
const SlackMessage = require('./slack-message')
const SlackChannel = require('./slack-channel')
const SlackUser = require('./slack-user')

const imageStore = require('../../controller/image-store')

function compareChannel(a, b) {
  a = a.name.toUpperCase()
  b = b.name.toUpperCase()
  if (a < b)
    return -1
  if (a > b)
    return 1
  return 0
}

function filterChannel(c) {
  if (c.is_archived)
    return false
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

    this.rtm.on('channel_history_changed', this.onHistoryChanged.bind(this))
    this.rtm.on('group_history_changed', this.onHistoryChanged.bind(this))

    this.rtm.on('channel_joined', this.onJoinChannel.bind(this))
    this.rtm.on('group_joined', this.onJoinChannel.bind(this))
    this.rtm.on('group_open', this.onJoinChannel.bind(this))

    this.rtm.on('channel_archive', this.onLeaveChannel.bind(this))
    this.rtm.on('channel_deleted', this.onLeaveChannel.bind(this))
    this.rtm.on('channel_left', this.onLeaveChannel.bind(this))
    this.rtm.on('group_archive', this.onLeaveChannel.bind(this))
    this.rtm.on('group_close', this.onLeaveChannel.bind(this))
    this.rtm.on('group_left', this.onLeaveChannel.bind(this))
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

  disconnect() {
    if (this.rtm.connected)
      this.rtm.disconnect()
  }

  async getAllChannels() {
    const options = {exclude_members: true}
    const {channels} = await this.rtm.webClient.channels.list(options)
    const {groups} = await this.rtm.webClient.groups.list(options)
    return channels.concat(groups).map((c) => new SlackChannel(this, c))
  }

  async join(channel) {
    if (channel.isChannel)
      await this.rtm.webClient.channels.join({name: channel.name, validate: true})
    else if (channel.isGroup)
      await this.rtm.webClient.groups.open({channel: channel.id})
  }

  async onReady(data) {
    // Fetch users.
    // TODO We need a better policy for users cache.
    const {members} = await this.rtm.webClient.users.list()
    for (const m of members)
      this.users[m.id] = new SlackUser(m)
    // Current user.
    this.currentUserId = data.self.id
    // Fetch channels.
    const options = {exclude_members: true, unreads: true}
    const {channels} = await this.rtm.webClient.channels.list(options)
    const {groups} = await this.rtm.webClient.groups.list(options)
    this.channels = channels.filter(filterChannel)
                            .concat(groups.filter(filterChannel))
                            .sort(compareChannel)
                            .map((c) => new SlackChannel(this, c))
    this.isReady = true
    this.onUpdateChannels.dispatch(this.channels)
    // The unread info from channels.list is not complete, update info asyncly.
    for (const c of this.channels)
      c.updateInfo()
    // Update current team information.
    const {team} = await this.rtm.webClient.team.info()
    this.icon = await imageStore.getImage('team', team.id, team.icon.image_132)
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

  onHistoryChanged(event) {
    // TODO Reload chat.
    const channel = this.findChannelById(event.channel)
    if (channel)
      channel.clear()
  }

  async onJoinChannel(event) {
    let channel
    if (event.type === 'group_open') {
      const {group} = this.rtm.webClient.groups.info({channel: event.channel})
      channel = new SlackChannel(this, group)
    } else {
      channel = new SlackChannel(this, event.channel)
    }
    const i = bounds.gt(this.channels, channel, compareChannel)
    this.channels.splice(i, 0, channel)
    this.onAddChannel.dispatch(i, channel)
  }

  onLeaveChannel(event) {
    const index = this.channels.findIndex((c) => c.id == event.channel)
    if (index === -1)
      return
    this.onRemoveChannel.dispatch(index, this.channels[index])
    this.channels.splice(index, 1)
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
