const WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

const MONTH = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

function ordinalSuffixOf(i) {
  const j = i % 10
  const k = i % 100
  if (j == 1 && k != 11) {
    return i + 'st'
  }
  if (j == 2 && k != 12) {
    return i + 'nd'
  }
  if (j == 3 && k != 13) {
    return i + 'rd'
  }
  return i + 'th'
}

class Message {
  constructor(id, text, timestamp) {
    this.id = String(id)
    this.text = text ? text : ''
    this.date = new Date(timestamp * 1000)
    this.timestamp = timestamp
    this.shortTime = ('0' + this.date.getHours()).substr(-2) + ':' +
                     ('0' + this.date.getMinutes()).substr(-2)
    this.isEdited = false
    this.isFolded = false
    this.isDayMarker = false
    this.isBot = false
    this.isSub = false
    this.isThreadParent = false
    this.threadId = null
    this.attachments = []
    this.files = []
    this.replyCount = 0
    this.reactions = []
    this.user = null
    this.hasMention = false
    this.hasStar = false
  }

  setDayMarker() {
    this.isDayMarker = true
    const now = new Date()
    const yesterday = new Date()
    yesterday.setDate(now.getDate() - 1)
    if (this.date.getDate() === now.getDate() &&
        this.date.getMonth() === now.getMonth() &&
        this.date.getYear() === now.getYear()) {
      this.dayTime = 'Today'
    } else if (this.date.getDate() == yesterday.getDate() &&
               this.date.getMonth() === now.getMonth() &&
               this.date.getYear() === now.getYear()) {
      this.dayTime = 'Yesterday'
    } else {
      this.dayTime = `${WEEK[this.date.getDay()]}, ${
          MONTH[this.date.getMonth()]} ${ordinalSuffixOf(this.date.getDate())}`
    }
  }
}

module.exports = Message
