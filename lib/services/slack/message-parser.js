const rules = [
  {
    regex: /(\r\n|\r|\n)/g,
    replacer() {
      return '<br/>'
    }
  },
  {
    regex: /\*([^\*]+)\*/g,
    replacer(match, p1) {
      return `<strong>${p1}</strong>`
    }
  },
  {
    regex: /_([^_]+)_/g,
    replacer(match, p1) {
      return `<em>${p1}</em>`
    }
  },
  {
    regex: /~([^~]+)~/g,
    replacer(match, p1) {
      return `<del>${p1}</del>`
    }
  },
  {
    regex: /```([^```]+)```/g,
    replacer(match, p1) {
      return `<pre>${p1}</pre>`
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

function parseReferences(text) {
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
      return parseReferences(content)
    } else {
      return `<a href="${content}">${display}</a>`
    }
  })
}

function slackMarkdownToHtml(text) {
  // Links in code should also be parsed.
  text = parseLinks(text)
  // Translate markdown in text but ignore the text inside code blocks.
  let start = 0
  let newText = ''
  while ((preIndex = text.indexOf('```', start)) !== -1) {
    newText += runRules(text.substring(start, preIndex))
    start = preIndex + 3
    preIndex = text.indexOf('```', start)
    if (preIndex === -1)
      break
    newText += '<pre>' + text.substring(start, preIndex) + '</pre>'
    start = preIndex + 3
  }
  newText += runRules(text.substr(start))
  return newText
}

module.exports = slackMarkdownToHtml
