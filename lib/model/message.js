const WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

const MONTH = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

class Message {
  constructor(id, text, timestamp) {
    this.id = id
    this.text = text
    this.date = new Date(timestamp * 1000)
    this.shortTime = ('0' + this.date.getHours()).substr(-2) + ':' +
                     ('0' + this.date.getMinutes()).substr(-2)
    this.isFolded = false
    this.isDayMarker = false
    this.isBot = false
    this.user = null
  }

  setDayMarker() {
    this.isDayMarker = true
    const now = new Date()
    const yesterday = new Date()
    yesterday.setDate(now.getDate() - 1)
    if (this.date.getDate() == now.getDate()) {
      this.dayTime = 'Today'
    } else if (this.date.getDate() == yesterday.getDate()) {
      this.dayTime = 'Yesterday'
    } else {
      this.dayTime = `${WEEK[this.date.getDay()]}, ${MONTH[this.date.getMonth()]} ${this.date.getDate()}`
    }
  }
}

module.exports = Message
