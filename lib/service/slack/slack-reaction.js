const Reaction = require('../../model/reaction')

const {parseEmoji} = require('./message-parser')

function normalizeReactionName(name) {
  const skin = name.indexOf('::')
  if (skin !== -1)
    return name.substring(0, skin)
  else
    return name
}

class SlackReaction extends Reaction {
  constructor(account, name, count) {
    name = normalizeReactionName(name)
    super(name, count, parseEmoji(account, 16, name))
  }
}

module.exports = SlackReaction
