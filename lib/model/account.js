const Signal = require('mini-signals')

const accountManager = require('../controller/account-manager')

class Account {
  constructor(service, config) {
    this.service = service
    this.id = config.id
    this.name = config.name
    this.icon = config.icon ? config.icon : null
    this.url = `https://${this.id}.${this.service.id}.com`
    this.channels = []
    this.dms = []
    this.emoji = {}
    this.currentChannelId = config.currentChannelId ? config.currentChannelId : null
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
    return config
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
