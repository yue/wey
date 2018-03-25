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

function parseReference(text) {
  return text
}

function parseAt(text) {
  return text
}

function parseLinks(text) {
  return text.replace(/<([^<>]+)>/g, (_, p1) => {
    let content, display
    const match = p1.match(/(.+)\|(.+)/)
    if (match) {
      content = match[1]
      display = match[2]
    } else {
      content = display = p1
    }
    if (content.startsWith('!')) {
      return parseReference(content)
    } else if (content.startsWith('@')) {
      return parseAt(content)
    } else {
      return `<a href="${content}">${display}</a>`
    }
  })
}

function slackMarkdownToHtml(text) {
  if (!text)
    return ''
  // Links in code should also be parsed.
  text = parseLinks(text)
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
