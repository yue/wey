const bounds = require('binary-search-bounds')
const {RTMClient} = require('@slack/client')

const Account = require('../../model/account')
const SlackMessage = require('./slack-message')
const SlackChannel = require('./slack-channel')
const SlackUser = require('./slack-user')

const imageStore = require('../../controller/image-store')

function compareChannel(a, b) {
  const nameA = a.name.toUpperCase()
  const nameB = b.name.toUpperCase()

  // Push muted channels to bottom of list.
  if (a.is_muted === b.is_muted) {
    if (nameA < nameB)
      return -1
    if (nameA > nameB)
      return 1
    return 0
  }

  if (a.is_muted)
    return 1

  return -1
}

function filterChannel(c) {
  if (c.is_archived)
    return false
  if (c.is_channel)
    return c.is_member
  // Used by groups.
  if (c.is_open !== undefined)
    return c.is_open
  return true
}

class SlackAccount extends Account {
  constructor(service, data, rtm, config=null) {
    if (config) {
      super(service, config)
      this.rtm = new RTMClient(config.token)
      require('./private-apis').extend(this.rtm)
      this.rtm.once('unable_to_rtm_start', this.reportError.bind(this))
      this.rtm.once('authenticated', this.ready.bind(this))
      this.rtm.start()
    } else {
      super(service, {id: data.team.id, name: data.team.name})
      this.rtm = rtm
      this.ready(data)
    }

    // Indicate whether this is reconnection.
    // the ready method has been called.
    this.isReconnect = false

    this.rtm.on('error', this.reportError.bind(this))
    this.rtm.on('connected', this.handleConnection.bind(this))
    this.rtm.on('disconnected', this.handleDisconnection.bind(this))
    this.rtm.on('connecting', this.handleConnecting.bind(this))
    this.rtm.on('reconnecting', this.handleConnecting.bind(this))

    this.rtm.on('message', this.dispatchMessage.bind(this))

    this.rtm.on('channel_marked', this.markRead.bind(this))
    this.rtm.on('group_marked', this.markRead.bind(this))
    this.rtm.on('im_marked', this.markRead.bind(this))

    this.rtm.on('channel_history_changed', this.reloadHistory.bind(this))
    this.rtm.on('group_history_changed', this.reloadHistory.bind(this))

    this.rtm.on('channel_joined', this.joinChannel.bind(this))
    this.rtm.on('group_joined', this.joinChannel.bind(this))
    this.rtm.on('group_open', this.joinChannel.bind(this))

    this.rtm.on('im_open', this.openDM.bind(this))

    this.rtm.on('channel_archive', this.leaveChannel.bind(this))
    this.rtm.on('channel_deleted', this.leaveChannel.bind(this))
    this.rtm.on('channel_left', this.leaveChannel.bind(this))
    this.rtm.on('group_archive', this.leaveChannel.bind(this))
    this.rtm.on('group_close', this.leaveChannel.bind(this))
    this.rtm.on('group_left', this.leaveChannel.bind(this))
  }

  serialize() {
    const config = {
      token: this.rtm.webClient.token,
    }
    return Object.assign(super.serialize(), config)
  }

  async disconnect() {
    if (this.rtm.connected)
      this.rtm.disconnect()
  }

  async reload() {
    if (this.status === 'disconnected')
      this.rtm.start()
    else if (this.status === 'connected')
      await this.updateChannels()
  }

  async getAllChannels() {
    return await this.listChannels({
      exclude_archived: true,
      exclude_members: true,
      types: 'public_channel,private_channel',
    })
  }

  async join(channel) {
    await this.rtm.webClient.conversations.join({channel: channel.id})
  }

  async leave(channel) {
    await this.rtm.webClient.conversations.leave({channel: channel.id})
  }

  async ready(data) {
    // Update current team information.
    const {team} = await this.rtm.webClient.team.info()
    this.icon = await imageStore.getImage('team', team.id, team.icon.image_132)
    this.onUpdateInfo.dispatch(this)
    // Fetch users.
    // TODO We need a better policy for users cache.
    const {members} = await this.rtm.webClient.users.list()
    for (const m of members)
      this.users[m.id] = new SlackUser(m)
    // Current user.
    this.currentUserId = data.self.id
    // Fetch channels.
    await this.updateChannels()
  }

  async updateChannels() {
    const options = {
      include_message: 1,
      mpim_aware: 1,
      only_relevant_ims: 1,
      simple_unreads: 1,
    }
    const {channels, groups, ims, mpims} = await this.rtm.webClient.users.counts(options)
    this.channels = channels.concat(groups)
                            .filter(filterChannel)
                            .sort(compareChannel)
                            .map((c) => new SlackChannel(this, 'channel', c))
    this.dms = ims.concat(mpims)
                             .filter(filterChannel)
                             .map((c) => new SlackChannel(this, 'dm', c))
    // Notify.
    this.setReadState(this.computeReadState())
    this.isChannelsReady = true
    this.onUpdateChannels.dispatch(this.channels)
  }

  reportError(error) {
    // TODO Show error box.
    console.error(error)
  }

  handleConnection() {
    this.status = 'connected'
    this.onUpdateConnection.dispatch()
    if (this.isReconnect)
      this.updateChannels()
    else  // all connections are re-connect except for the first one.
      this.isReconnect = true
  }

  handleDisconnection() {
    for (const c of this.channels)
      c.clear()
    this.status = 'disconnected'
    this.onUpdateConnection.dispatch()
  }

  handleConnecting() {
    this.status = 'connecting'
    this.onUpdateConnection.dispatch()
  }

  async dispatchMessage(event) {
    const channel = this.findChannelById(event.channel)
    if (channel) {
      switch (event.subtype) {
        case 'message_deleted':
          channel.deleteMessage(event.deleted_ts, event.deleted_ts)
          break
        case 'message_changed':
          channel.modifyMessage(event.message.ts,
                                event.message.ts,
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

  markRead(event) {
    const channel = this.findChannelById(event.channel)
    if (channel)
      channel.markRead()
  }

  reloadHistory(event) {
    // TODO Reload chat.
    const channel = this.findChannelById(event.channel)
    if (channel)
      channel.clear()
  }

  async joinChannel(event) {
    let channel
    if (event.type === 'group_open') {
      const group = (await this.rtm.webClient.conversations.info({channel: event.channel})).channel
      channel = new SlackChannel(this, 'channel', group)
    } else {
      channel = new SlackChannel(this, 'channel', event.channel)
    }
    const i = bounds.gt(this.channels, channel, compareChannel)
    this.channels.splice(i, 0, channel)
    this.onAddChannel.dispatch(i, channel)
  }

  leaveChannel(event) {
    const index = this.channels.findIndex((c) => c.id == event.channel)
    if (index === -1)
      return
    this.onRemoveChannel.dispatch(index, this.channels[index])
    this.channels.splice(index, 1)
  }

  async openDM(event) {
    const channel = new SlackChannel(this, 'dm', event)
    this.dms.unshift(channel)
    this.onOpenDM.dispatch(0, channel)
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

  async listChannels(options, filter) {
    let ret = []
    while (true) {
      // Read all channels using pagination.
      let {channels, response_metadata} = await this.rtm.webClient.conversations.list(options)
      if (filter)
        channels = channels.filter(filter)
      ret = ret.concat(channels.map((c) => new SlackChannel(this, 'channel', c)))
      if (response_metadata && response_metadata.next_cursor)
        options.cursor = response_metadata.next_cursor
      else
        break
    }
    return ret.sort(compareChannel)
  }
}

module.exports = SlackAccount
