class Service {
  constructor(name) {
    this.name = name
  }

  login(callback) {
    throw new Error('This method should be implemented by clients')
  }
}

module.exports = Service
