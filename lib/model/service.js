class Service {
  constructor(name, Account, Channel) {
    this.name = name
    this.Account = Account
    this.Channel = Channel
  }

  login(callback) {
    throw new Error('This method should be implemented by clients')
  }
}

module.exports = Service
