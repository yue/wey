class User {
  constructor(id, name, avatar, realName, email, phoneNumber) {
    this.id = id
    this.name = name
    this.avatar = avatar
    this.realName = realName
    this.email = email
    this.phoneNumber = phoneNumber
    this.isBot = false
    this.isAway = true
    this.statusEmoji = null
  }
}

module.exports = User
