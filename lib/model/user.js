class User {
  constructor(id, name, avatar) {
    this.id = id
    this.name = name
    this.avatar = avatar
    this.isBot = false
    this.statusEmoji = null
  }
}

module.exports = User
