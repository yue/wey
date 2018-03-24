class Message {
  constructor(text, timestamp) {
    this.text = text
    this.date = new Date(timestamp * 1000)
    this.shortTime = ('0' + this.date.getHours()).substr(-2) + ':' +
                     ('0' + this.date.getMinutes()).substr(-2)
    this.user = null
  }
}

module.exports = Message
