const fs = require('fs')
const path = require('path')
const gui = require('gui')

const handlebars = require('./handlebars')
const accountManager = require('../../controller/account-manager')

const messageTemplate = handlebars.compile(
  fs.readFileSync(path.join(__dirname, 'messages.html')).toString())

gui.Browser.registerProtocol('wey', (url) => {
  // Generate messages.
  const found = url.match(/wey:\/\/chat\/messages\/(\w+)\/(\w+)/)
  if (found) {
    const account = accountManager.findAccountById(found[1])
    if (!account)
      return gui.ProtocolStringJob.create('text/html', `Unkown account: ${found[1]}`)
    const channel = account.findChannelById(found[2])
    if (!channel)
      return gui.ProtocolStringJob.create('text/html', `Unkown channel: ${found[2]}`)
    const page = messageTemplate({account, channel})
    return gui.ProtocolStringJob.create('text/html', page)
  }
  // Error.
  return gui.ProtocolStringJob.create('text/html', `Unkown url: ${url}`)
})
