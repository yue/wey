const Attachment = require('../../model/attachment')

const {slackMarkdownToHtmlSync} = require('./message-parser')

class SlackAttachment extends Attachment {
  constructor(account, att) {
    super(att.text ? slackMarkdownToHtmlSync(account, att.text) : null)
    if (att.pretext)
      this.preText = slackMarkdownToHtmlSync(account, att.pretext)
    if (att.color)
      this.color = '#' + att.color
    if (att.title) {
      this.title = att.title
      this.titleLink = att.title_link
    }
    if (att.author_name) {
      this.author = att.author_name
      this.authorLink = att.author_link
      this.authorIcon = att.author_icon
    }
  }
}

module.exports = SlackAttachment
