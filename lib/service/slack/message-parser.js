const stringReplaceAsync = require('string-replace-async')
const sanitizeHtml = require('sanitize-html')

const emoji = require('./emoji.json')

function parseEmoji(account, size, p1) {
  const custom = account.emoji[p1]
  if (custom)
    return `<span style="background-image: url(${custom})" class="custom size-${size} emoji"></span>`
  const data = emoji[p1]
  if (!data)
    return null
  const x = data.x * size
  const y = data.y * size
  return `<span style="background-position: -${x}px -${y}px" class="apple size-${size} emoji"></span>`
}

const rules = [
  {
    regex: /:([a-zA-Z0-9_\-\+]+(::skin-tone-\d)?):/g,
    replacer(account, match, p1) {
      const r = parseEmoji(account, 22, p1)
      return r !== null ? r : match[0]
    }
  },
  {
    regex: /(\n\n)/g,
    replacer() {
      return '<span class="para-br"><br></span>'
    }
  },
  {
    regex: /(\r\n|\r|\n)/g,
    replacer() {
      return '<br>'
    }
  },
  {
    regex: /(^|[^\w]+)\*([^\*]+)\*([^\w]+|$)/g,
    replacer(account, match, p1, p2, p3) {
      return `${p1}<strong>${p2}</strong>${p3}`
    }
  },
  {
    regex: /(^|[^\w]+)_([^_]+)_([^\w]+|$)/g,
    replacer(account, match, p1, p2, p3) {
      return `${p1}<em>${p2}</em>${p3}`
    }
  },
  {
    regex: /(^|[^\w]+)~([^~]+)~([^\w]+|$)/g,
    replacer(account, match, p1, p2, p3) {
      return `${p1}<del>${p2}</del>${p3}`
    }
  },
  {
    regex: /`([^`]+)`/g,
    replacer(account, match, p1) {
      return `<code>${p1}</code>`
    }
  },
]

function runRules(account, text) {
  for (const rule of rules)
    text = text.replace(rule.regex, rule.replacer.bind(null, account))
  return text
}

function parseReference(content, display) {
  if (['!channel', '!here', '!everyone'].includes(content))
    return `<span class="broadcast">@${content.substr(1)}</span>`
  else if (content.startsWith('!subteam')) {
    return `<span class="at">${display}</span>`
  }
  else
    return display
}

function parseChannel(account, id, display) {
  const archiveLink = `${account.url}/archives/${id}`
  return `<a href="${archiveLink}" onclick="wey.openChannel('${id}'); return false">#${display}</a>`
}

async function parseAt(account, id) {
  const user = await account.fetchUser(id)
  if (!user)
    return `@&lt;unknown user: ${id}&gt;`
  if (id === account.currentUserId)
    return `<span class="broadcast at">@${user.name}</span>`
  else
    return `<span class="at">@${user.name}</span>`
}

function parseSlackLink(account, text, shouldParseAt) {
  let content, display
  const match = text.match(/(.+)\|(.+)/)
  if (match) {
    content = match[1]
    display = match[2]
  } else {
    content = display = text
  }
  if (content.startsWith('!')) {
    return [true, parseReference(content, display)]
  } else if (content.startsWith('#')) {
    return [false, parseChannel(account, content.substr(1), display)]
  } else if (shouldParseAt && content.startsWith('@')) {
    const hasMention = content.substr(1) === account.currentUserId
    return [hasMention, parseAt(account, content.substr(1))]
  } else {
    return [false, `<a href="${content}">${display}</a>`]
  }
}

function parseMarkdown(account, text) {
  // Translate markdown in text but ignore the text inside code blocks.
  let start = 0
  let newText = ''
  while ((preIndex = text.indexOf('```', start)) !== -1) {
    newText += runRules(account, text.substring(start, preIndex).trim())
    start = preIndex + 3
    preIndex = text.indexOf('```', start)
    if (preIndex === -1)
      break
    newText += '<pre>' + text.substring(start, preIndex).trim() + '</pre>'
    start = preIndex + 3
  }
  newText += runRules(account, text.substr(start).trimLeft())

  // Our parser is buggy, and sometimes HTML passed from Slack is also bug, the
  // easist way to fix this is to run sanitizeHtml.
  return sanitizeHtml(newText, {allowedTags: false, allowedAttributes: false})
}

function slackMarkdownToHtmlSync(account, text) {
  text = text.replace(/<([^<>]+)>/g, (_, p1) => parseSlackLink(account, p1, false)[1])
  return parseMarkdown(account, text)
}

async function parseLinks(account, text) {
  let anyHasMention = false
  text = await stringReplaceAsync(text, /<([^<>]+)>/g, async (_, p1) => {
    const [hasMention, result] = parseSlackLink(account, p1, true)
    if (hasMention)
      anyHasMention = true
    if (result instanceof Promise)
      return await result
    else
      return result
  })
  return [anyHasMention, text]
}

async function slackMarkdownToHtml(account, text) {
  const [hasMention, result] = await parseLinks(account, text)
  return [hasMention, parseMarkdown(account, result)]
}

module.exports = {parseEmoji, slackMarkdownToHtml, slackMarkdownToHtmlSync}
