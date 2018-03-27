const stringReplaceAsync = require('string-replace-async')

const rules = [
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
    replacer(match, p1, p2, p3) {
      return `${p1}<strong>${p2}</strong>${p3}`
    }
  },
  {
    regex: /(^|[^\w]+)_([^_]+)_([^\w]+|$)/g,
    replacer(match, p1, p2, p3) {
      return `${p1}<em>${p2}</em>${p3}`
    }
  },
  {
    regex: /(^|[^\w]+)~([^~]+)~([^\w]+|$)/g,
    replacer(match, p1, p2, p3) {
      return `${p1}<del>${p2}</del>${p3}`
    }
  },
  {
    regex: /`([^`]+)`/g,
    replacer(match, p1) {
      return `<code>${p1}</code>`
    }
  },
]

function runRules(text) {
  for (const rule of rules) {
    text = text.replace(rule.regex, rule.replacer)
  }
  return text
}

function parseReference(content, display) {
  if (['!channel', '!here', '!everyone'].includes(content))
    return `<span class="broadcast">@${content.substr(1)}</span>`
  else
    return display
}

function parseChannel(id, display) {
  return `<a href="#" onclick="wey.openChannel('${id}'); return false">#${display}</a>`
}

async function parseAt(account, id) {
  const user = await account.fetchUser(id)
  if (!user)
    return `@<unkown user: ${id}>`
  return `<span class="at">@${user.name}</span>`
}

async function parseLinks(account, text) {
  return await stringReplaceAsync(text, /<([^<>]+)>/g, async (_, p1) => {
    let content, display
    const match = p1.match(/(.+)\|(.+)/)
    if (match) {
      content = match[1]
      display = match[2]
    } else {
      content = display = p1
    }
    if (content.startsWith('!')) {
      return parseReference(content, display)
    } else if (content.startsWith('#')) {
      return parseChannel(content.substr(1), display)
    } else if (content.startsWith('@')) {
      return await parseAt(account, content.substr(1))
    } else {
      return `<a href="#" onclick="wey.openLink('${content}'); return false">${display}</a>`
    }
  })
}

async function slackMarkdownToHtml(account, text) {
  // Links in code should also be parsed.
  text = await parseLinks(account, text)
  // Translate markdown in text but ignore the text inside code blocks.
  let start = 0
  let newText = ''
  while ((preIndex = text.indexOf('```', start)) !== -1) {
    newText += runRules(text.substring(start, preIndex).trim())
    start = preIndex + 3
    preIndex = text.indexOf('```', start)
    if (preIndex === -1)
      break
    newText += '<pre>' + text.substring(start, preIndex).trim() + '</pre>'
    start = preIndex + 3
  }
  newText += runRules(text.substr(start).trimLeft())
  return newText
}

module.exports = slackMarkdownToHtml
