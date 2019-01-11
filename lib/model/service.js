class Service {
  constructor(id, name) {
    this.id = id
    this.name = name
  }

  login(callback) {
    throw new Error('This method should be implemented by clients')
  }

  createAccount(id, name, token) {
    throw new Error('This method should be implemented by clients')
  }
}

module.exports = Service
