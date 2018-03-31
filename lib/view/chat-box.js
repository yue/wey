const fs = require('fs')
const path = require('path')
const gui = require('gui')
const opn = require('opn')
const fileUrl = require('file-url')

const handlebars = require('./chat/handlebars')
const accountManager = require('../controller/account-manager')

handlebars.registerHelper('isFirstUnread', function (channel, message, options) {
  if (channel.firstUnreadTs === message.timestamp)
    return options.fn(this)
  else
    return options.inverse(this)
})

// Templates for handlebarjs.
const messageHtml = fs.readFileSync(path.join(__dirname, 'chat', 'message.html')).toString()
handlebars.registerPartial('messagePartial', messageHtml)
const messageTemplate = handlebars.compile(messageHtml)
const pageTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, 'chat', 'page.html')).toString())

// The page that shows loading indicator.
// (call realpathSync to keep compatibility with ASAR.)
const loadingUrl = fileUrl(fs.realpathSync(path.join(__dirname, 'chat', 'loading.html')))

class ChatBox {
  constructor(mainWindow) {
    this.mainWindow = mainWindow

    this.channel = null
    this.subscription = null
    this.isBrowserReady = false
    this.isSendingReply = false
    this.pendingMessages = []

    this.view = gui.Container.create()
    this.view.setStyle({flex: 1})

    this.browser = gui.Browser.create({devtools: true, contextMenu: true})
    this.browser.setStyle({flex: 1})
    this.browser.setBindingName('wey')
    this.browser.addBinding('ready', this.ready.bind(this))
    this.browser.addBinding('openLink', this.openLink.bind(this))
    this.browser.addBinding('openChannel', this.openChannel.bind(this))
    this.view.addChildView(this.browser)

    this.replyBox = gui.Container.create()
    this.replyBox.setStyle({
      padding: 5,
    })
    this.view.addChildView(this.replyBox)

    const font = gui.Font.create(gui.Font.default().getName(), 15, 'normal', 'normal')
    this.replyEntry = gui.TextEdit.create()
    this.replyEntry.setFont(font)
    this.replyEntry.setStyle({height: 20})
    this.replyEntry.onKeyUp = this.handleKeyUp.bind(this)
    this.replyEntry.setEnabled(false)
    this.replyBox.addChildView(this.replyEntry)
  }

  unload() {
    if (this.subscription) {
      this.subscription.onMessage.detach()
      this.subscription.onDeleteMessage.detach()
      this.subscription.onModifyMessage.detach()
      this.subscription = null
    }
    if (this.channel) {
      if (this.isBrowserReady)
        this.channel.deselect()
      this.pendingMessages = []
      this.channel = null
    }
  }

  setLoading() {
    if (this.browser.getURL() === loadingUrl)
      return
    this.unload()
    this.replyBox.setVisible(false)
    this.browser.loadURL(loadingUrl)
  }

  async loadChannel(account, channel) {
    this.unload()
    this.replyEntry.setEnabled(false)
    // Show progress bar if we need to fetch messages.
    if (!channel.messagesReady)
      this.setLoading()
    this.channel = channel
    this.subscription = {
      onMessage: channel.onMessage.add(this.newMessage.bind(this)),
      onDeleteMessage: channel.onDeleteMessage.add(this.deleteMessage.bind(this)),
      onModifyMessage: channel.onModifyMessage.add(this.modifyMessage.bind(this)),
    }
    // Make sure messages are loaded before loading the view.
    await channel.readMessages()
    this.isBrowserReady = false
    // Start showing the messages.
    fs.writeFileSync('page.html', pageTemplate({account, channel}))
    if (channel === this.channel) {
      this.replyBox.setVisible(true)
      this.browser.loadHTML(pageTemplate({account, channel}),
                            `https://${account.id}.slack.com`)
    }
  }

  newMessage(message) {
    if (!this.isBrowserReady) {
      this.pendingMessages.push(message)
      return
    }
    const html = messageTemplate({channel: this.channel, message})
    this.browser.executeJavaScript(`window.addMessage(${JSON.stringify(html)})`, () => {})
  }

  deleteMessage(id, timestamp) {
    if (this.isBrowserReady)
      this.browser.executeJavaScript(`window.deleteMessage("${id}")`, () => {})
  }

  modifyMessage(id, timestamp, text) {
    if (this.isBrowserReady)
      this.browser.executeJavaScript(`window.modifyMessage("${id}", ${JSON.stringify(text)})`, () => {})
  }

  ready() {
    this.replyEntry.setEnabled(true)
    this.replyEntry.focus()
    this.isBrowserReady = true
    for (const m of this.pendingMessages)
      this.newMessage(m)
    this.pendingMessages = []
    this.channel.select()
    this.channel.notifyRead()
  }

  openLink(link) {
    opn(link)
  }

  openChannel(channel) {
    this.mainWindow.channelsPanel.selectChannelById(channel)
  }

  handleKeyUp(self, event) {
    if (event.key == 'Enter' && !(event.modifiers & gui.Event.maskShift)) {
      const message = self.getText()
      if (message.length == 0 || !this.channel || this.isSendingReply)
        return true
      self.setEnabled(false)
      this.isSendingReply = true
      this.channel.sendMessage(message)
                  .then((res) => {
                    self.setText('')
                    self.setEnabled(true)
                    this.isSendingReply = false
                  })
                  .catch((error) => {
                    // TODO Report error
                    self.setEnabled(true)
                    this.isSendingReply = false
                  })
      return true
    }
    return false
  }
}

module.exports = ChatBox
