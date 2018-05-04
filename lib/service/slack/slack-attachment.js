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
    if (att.image_url) {
      this.image = att.image_url
      this.imageUrl = att.image_url
      this.imageWidth = Math.min(att.image_width, 360)
      this.imageHeight = att.image_height * this.imageWidth / att.image_width
    }
    if (att.video_html) {
      this.image = att.thumb_url
      this.imageUrl = att.video_url
      this.imageWidth = Math.min(att.thumb_width, 360)
      this.imageHeight = att.thumb_height * this.imageWidth / att.thumb_width
    }
  }
}

module.exports = SlackAttachment
