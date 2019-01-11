const Signal = require('mini-signals')

const accountManager = require('../controller/account-manager')

class Account {
  constructor(service, id, name) {
    this.service = service
    this.id = id
    this.name = name
    this.icon = null
    this.url = `https://${this.id}.${service.id}.com`
    this.authorizationHeader = null
    this.channels = []
    this.dms = []
    this.emoji = {}
    this.currentChannelId = null
    this.currentUserId = null
    this.currentUserName = null
    this.users = {}
    this.isRead = true
    this.mentions = 0

    this.status = 'connecting'
    this.isChannelsReady = false

    this.onUpdateChannels = new Signal()
    this.onUpdateInfo = new Signal()
    this.onUpdateReadState = new Signal()
    this.onUpdateMentions = new Signal()
    this.onUpdateConnection = new Signal()
    this.onAddChannel = new Signal()
    this.onRemoveChannel = new Signal()
    this.onOpenDM = new Signal()
    this.onCloseDM = new Signal()

    accountManager.addAccount(this)
  }

  serialize() {
    const config = { id: this.id, name: this.name }
    if (this.currentChannelId)
      Object.assign(config, { currentChannelId: this.currentChannelId })
    if (this.icon)
      Object.assign(config, { icon: this.icon })
    for (const messageList of this.channels.concat(this.dms)) {
      const c = messageList.serialize()
      if (!c)
        continue
      if (!config.channels)
        config.channels = []
      config.channels.push(c)
    }
    return config
  }

  deserialize(config) {
    if (config.icon)
      this.icon = config.icon
    if (config.currentChannelId)
      this.currentChannelId = config.currentChannelId
    // Save the config of channels, since channels are loaded later.
    if (config.channels)
      this.channelsConfig = config.channels.reduce((r, i) => { r[i.id] = i; return r }, {})
  }

  channelsLoaded() {
    if (this.channelsConfig) {
      for (const messageList of this.channels.concat(this.dms)) {
        const config = this.channelsConfig[messageList.id]
        if (config)
          messageList.deserialize(config)
      }
    }
    this.setReadState(this.computeReadState())
    this.updateMentions()
    this.isChannelsReady = true
    this.onUpdateChannels.dispatch(this.channels)
  }

  findChannelById(id) {
    let channel = this.channels.find((c) => c.id == id)
    if (!channel)
      channel = this.dms.find((c) => c.id == id)
    return channel
  }

  // DMs treated as channels.
  findChannelByUserId(id) {
    return this.dms.find((c) => c.userId === id)
  }

  findUserById(id) {
    return this.users[id]
  }

  computeReadState() {
    const compute = (r, c) => { return (c.isRead || c.isMuted) ? r : false }
    return this.channels.reduce(compute, this.dms.reduce(compute, true))
  }

  // Save user for ID lookup
  saveUser(newUser) {
    this.users[newUser.id] = newUser
    return newUser
  }

  setReadState(read) {
    if (this.isRead !== read) {
      this.isRead = read
      this.onUpdateReadState.dispatch(this.isRead)
      accountManager.onUpdateReadState.dispatch(accountManager.computeReadState())
    }
  }

  updateReadState() {
    this.setReadState(this.computeReadState())
  }

  updateMentions() {
    const compute = (m, c) => { return m + c.mentions }
    const mentions = this.channels.reduce(compute, this.dms.reduce(compute, 0))
    if (mentions !== this.mentions) {
      this.mentions = mentions
      this.onUpdateMentions.dispatch()
      accountManager.updateMentions()
    }
  }

  async disconnect() {
    throw new Error('Should be implemented by subclass')
  }

  async reload() {
    throw new Error('Should be implemented by subclass')
  }

  async getAllChannels() {
    throw new Error('Should be implemented by subclass')
  }

  async join(channel) {
    throw new Error('Should be implemented by subclass')
  }

  async leave(channel) {
    throw new Error('Should be implemented by subclass')
  }
}

module.exports = Account
