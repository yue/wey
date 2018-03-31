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
  // Used by groups.
  if (c.is_open !== undefined)
    return c.is_open
  // Used by direct messages.
  if (c.priority)
    return true
  return false
}

class SlackAccount extends Account {
  constructor(service, data, rtm, config=null) {
    if (config) {
      super(service, config)
      this.rtm = new RTMClient(config.token)
      this.rtm.once('unable_to_rtm_start', this.reportError.bind(this))
      this.rtm.once('authenticated', this.ready.bind(this))
      this.rtm.start()
    } else {
      super(service, {id: data.team.id, name: data.team.name})
      this.rtm = rtm
      this.ready(data)
    }

    this.rtm.once('error', this.reportError.bind(this))
    this.rtm.on('message', this.dispatchMessage.bind(this))

    this.rtm.on('channel_marked', this.markRead.bind(this))
    this.rtm.on('group_marked', this.markRead.bind(this))

    this.rtm.on('channel_history_changed', this.reloadHistory.bind(this))
    this.rtm.on('group_history_changed', this.reloadHistory.bind(this))

    this.rtm.on('channel_joined', this.joinChannel.bind(this))
    this.rtm.on('group_joined', this.joinChannel.bind(this))
    this.rtm.on('group_open', this.joinChannel.bind(this))

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

  static deserialize(service, config) {
    return new SlackAccount(service, null, null, config)
  }

  async disconnect() {
    if (this.rtm.connected)
      this.rtm.disconnect()
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
    // Fetch users.
    // TODO We need a better policy for users cache.
    const {members} = await this.rtm.webClient.users.list()
    for (const m of members)
      this.users[m.id] = new SlackUser(m)
    // Current user.
    this.currentUserId = data.self.id
    this.currentUserName = data.self.name
    // Fetch channels.
    const options = {
      exclude_archived: true,
      exclude_members: true,
      unread: true,
      types: 'public_channel,private_channel',
    }
    this.channels = await this.listChannels(options, filterChannel)
    this.onUpdateChannels.dispatch(this.channels)
    this.setReadState(this.computeReadState())
    this.isReady = true
    // The unread info from channels.list is not complete, update info asyncly.
    for (const c of this.channels)
      c.updateInfo()
    // Update current team information.
    const {team} = await this.rtm.webClient.team.info()
    this.icon = await imageStore.getImage('team', team.id, team.icon.image_132)
    this.onUpdateInfo.dispatch(this)
    // Fetch direct messagses at last.
    this.directMessages = await this.getDirectMessages()
    this.onUpdateDirectMessages.dispatch(this.directMessages)
  }

  reportError(error) {
    // TODO Show error box.
    console.error(error)
  }

  async dispatchMessage(event) {
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
      const {group} = await this.rtm.webClient.conversations.info({channel: event.channel})
      channel = new SlackChannel(this, group)
    } else {
      channel = new SlackChannel(this, event.channel)
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
      ret = ret.concat(channels.map((c) => new SlackChannel(this, c)))
      if (response_metadata && response_metadata.next_cursor)
        options.cursor = response_metadata.next_cursor
      else
        break
    }
    return ret.sort(compareChannel)
  }

  async getDirectMessages() {
    const {ims} = await this.rtm.webClient.im.list()
    const dms = ims.sort((a, b) => a.priority - b.priority)
                   .map((c) => new SlackChannel(this, c))
    // The information returned by im.list is rather useless.
    await Promise.all(dms.map((dm) => dm.updateInfo()))
    const addOrderHint = (dm) => {
      if (dm.name === 'slackbot')
        dm.orderHint = '00'
      else if (dm.name === this.currentUserName)
        dm.orderHint = '01'
      else if (!dm.isRead)
        dm.orderHint = '02' + dm.name
      else
        dm.orderHint = '10' + dm.priority
      return dm
    }
    const compareHint = (a, b) => {
      if (a.orderHint < b.orderHint)
        return -1
      if (a.orderHint > b.orderHint)
        return 1
      return 0
    }
    return dms.map(addOrderHint).sort(compareHint).slice(0, 10)
  }
}

module.exports = SlackAccount
