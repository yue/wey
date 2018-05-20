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
  constructor(account, name, count, users) {
    name = normalizeReactionName(name)
    const hasCurrentUser = users && users.indexOf(account.currentUserId) > -1
    super(name, count, parseEmoji(account, 16, name), hasCurrentUser)
  }
}

module.exports = SlackReaction
