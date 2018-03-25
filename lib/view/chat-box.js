const fs = require('fs')
const path = require('path')
const gui = require('gui')

const handlebars = require('./chat/handlebars')
const accountManager = require('../controller/account-manager')

// Templates for handlebarjs.
const messageHtml = fs.readFileSync(path.join(__dirname, 'chat', 'message.html')).toString()
handlebars.registerPartial('messagePartial', messageHtml)
const messageTemplate = handlebars.compile(messageHtml)
const pageTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, 'chat', 'page.html')).toString())

class ChatBox {
  constructor() {
    this.channel = null
    this.subscription = null
    this.isBrowserReady = false
    this.pendingMessages = []

    this.view = gui.Browser.create({devtools: true, contextMenu: true})
    this.view.setStyle({
      flex: 1,
    })
    this.view.setBindingName('wey')
    this.view.addBinding('ready', this.onReady.bind(this))
  }

  async loadChannel(account, channel) {
    if (this.subscription)
      this.subscription.detach()
    this.pendingMessages = []
    this.channel = channel
    // Make sure messags are loaded before loading the view.
    await channel.readMessages()
    this.isBrowserReady = false
    this.subscription = channel.onMessage.add(this.onMessage.bind(this))
    // Start showing the messages.
    fs.writeFileSync('page.html', pageTemplate({account, channel}))
    this.view.loadHTML(pageTemplate({account, channel}), '')
  }

  onMessage(message) {
    if (!this.isBrowserReady) {
      this.pendingMessages.push(message)
      return
    }
    const html = messageTemplate({message})
    this.view.executeJavaScript(`window.addMessage(${JSON.stringify(html)})`, () => {})
  }

  onReady() {
    this.isBrowserReady = true
    for (const m of this.pendingMessages)
      this.onMessage(m)
  }
}

module.exports = ChatBox
