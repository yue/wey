const fs = require('fs')
const path = require('path')
const gui = require('gui')
const opn = require('opn')
const fileUrl = require('file-url')

const handlebars = require('./chat/handlebars')
const accountManager = require('../controller/account-manager')

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
    this.browser.addBinding('ready', this.onReady.bind(this))
    this.browser.addBinding('openLink', this.onOpenLink.bind(this))
    this.browser.addBinding('openChannel', this.onOpenChannel.bind(this))
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
    this.replyEntry.onKeyUp = this.onKeyUp.bind(this)
    this.replyEntry.setEnabled(false)
    this.replyBox.addChildView(this.replyEntry)
  }

  setLoading() {
    if (this.browser.getURL() == loadingUrl)
      return
    this.replyBox.setVisible(false)
    this.browser.loadURL(loadingUrl)
  }

  async loadChannel(account, channel) {
    if (this.subscription) {
      this.subscription.onMessage.detach()
      this.subscription.onDeleteMessage.detach()
      this.subscription.onModifyMessage.detach()
    }
    this.pendingMessages = []
    this.replyEntry.setEnabled(false)
    this.channel = channel
    this.view.setVisible(true)
    this.mainWindow.channelsSearcher.unload()
    // Show progress bar if we need to fetch messages.
    if (!channel.messagesReady)
      this.setLoading()
    this.subscription = {
      onMessage: channel.onMessage.add(this.onMessage.bind(this)),
      onDeleteMessage: channel.onDeleteMessage.add(this.onDeleteMessage.bind(this)),
      onModifyMessage: channel.onModifyMessage.add(this.onModifyMessage.bind(this)),
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

  onMessage(message) {
    if (!this.isBrowserReady) {
      this.pendingMessages.push(message)
      return
    }
    const html = messageTemplate({message})
    this.browser.executeJavaScript(`window.addMessage(${JSON.stringify(html)})`, () => {})
  }

  onDeleteMessage(id, timestamp) {
    if (this.isBrowserReady)
      this.browser.executeJavaScript(`window.deleteMessage("${id}")`, () => {})
  }

  onModifyMessage(id, timestamp, text) {
    if (this.isBrowserReady)
      this.browser.executeJavaScript(`window.modifyMessage("${id}", ${JSON.stringify(text)})`, () => {})
  }

  onReady() {
    this.replyEntry.setEnabled(true)
    this.replyEntry.focus()
    this.isBrowserReady = true
    for (const m of this.pendingMessages)
      this.onMessage(m)
    this.pendingMessages = []
    this.channel.notifyRead()
  }

  onOpenLink(link) {
    opn(link)
  }

  onOpenChannel(channel) {
    this.mainWindow.channelsPanel.selectChannelById(channel)
  }

  onKeyUp(self, event) {
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
