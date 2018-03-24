const Message = require('../../model/message')

class SlackMessage extends Message {
  constructor(event) {
    super(event.text, event.ts)
    this.user = event.user
  }
}

module.exports = SlackMessage
