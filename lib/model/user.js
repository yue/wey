class User {
  constructor(id, name, avatar, realName, email, phoneNumber, statusText, title) {
    this.id = id
    this.name = name
    this.avatar = avatar
    this.realName = realName
    this.email = email
    this.phoneNumber = phoneNumber
    this.statusText = statusText
    this.title = title
    this.isBot = false
    this.isAway = true
    this.statusEmoji = null
  }
}

module.exports = User
