class Service {
  constructor(id, name, Account, Channel) {
    this.id = id
    this.name = name
    this.Account = Account
    this.Channel = Channel
  }

  login(callback) {
    throw new Error('This method should be implemented by clients')
  }
}

module.exports = Service
