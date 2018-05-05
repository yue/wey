const fs = require('fs')
const path = require('path')
const gui = require('gui')
const opn = require('opn')
const fileUrl = require('file-url')

const ChannelHeader = require('./channel-header')

const handlebars = require('./chat/handlebars')
const accountManager = require('../controller/account-manager')
const windowManager = require('../controller/window-manager')
const {theme} = require('../controller/theme-manager')

handlebars.registerHelper('isFirstUnread', function(messageList, message, options) {
  if (messageList.firstUnreadTs === message.timestamp)
    return options.fn(this)
  else
    return options.inverse(this)
})

handlebars.registerHelper('displayRepliesButton', function(messageList, message, options) {
  if (messageList.type === 'channel' && message.isThreadParent)
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

    this.messageList = null
    this.subscription = null
    this.messagesLoaded = false
    this.isSendingReply = false
    this.isDisplaying = false
    this.pendingMessages = []

    this.view = gui.Container.create()
    this.view.setStyle({flex: 1})

    this.channelHeader = new ChannelHeader()
    // TODO Re-enable header when loading indicator is reimplemented with native
    // UI, otherwise our UI would feel unsmooth.
    // this.view.addChildView(this.channelHeader.view)

    this.browser = gui.Browser.create({devtools: true, contextMenu: true})
    this.browser.setStyle({flex: 1})
    this.browser.setBindingName('wey')
    this.browser.addBinding('ready', this.ready.bind(this))
    this.browser.addBinding('openLink', this.openLink.bind(this))
    this.browser.addBinding('openLinkContextMenu', this.openLinkContextMenu.bind(this))
    this.browser.addBinding('openChannel', this.openChannel.bind(this))
    this.browser.addBinding('openThread', this.openThread.bind(this))
    this.view.addChildView(this.browser)

    this.replyBox = gui.Container.create()
    this.replyBox.setBackgroundColor(theme.channelHeader.borderColor)
    this.replyBox.setStyle({padding: 5})
    this.view.addChildView(this.replyBox)

    this.replyEntry = gui.TextEdit.create()
    this.replyEntry.setEnabled(false)
    if (process.platform !== 'win32') {
      // Force using overlay scrollbar.
      this.replyEntry.setOverlayScrollbar(true)
      this.replyEntry.setScrollbarPolicy('never', 'automatic')
    }
    // Font size should be the same with messages.
    const font = gui.Font.create(gui.Font.default().getName(), 15, 'normal', 'normal')
    this.replyEntry.setFont(font)
    // Calculate height for 1 and 5 lines.
    this.replyEntry.setText('1')
    this.minReplyEntryHeight = this.replyEntry.getTextBounds().height
    this.replyEntry.setText('1\n2\n3\n4\n5')
    this.maxReplyEntryHeight = this.replyEntry.getTextBounds().height
    this.replyEntry.setText('')
    this.replyEntry.setStyle({height: this.minReplyEntryHeight})
    // Handle input events.
    this.replyEntry.onTextChange = this.adjustEntryHeight.bind(this)
    this.replyEntry.shouldInsertNewLine = this.handleEnter.bind(this)
    this.replyBox.addChildView(this.replyEntry)

    mainWindow.window.onFocus = this.focus.bind(this)
    mainWindow.window.onBlur = this.blur.bind(this)
  }

  unload() {
    if (this.subscription) {
      this.subscription.onMessage.detach()
      this.subscription.onDeleteMessage.detach()
      this.subscription.onModifyMessage.detach()
      this.subscription = null
    }
    if (this.messageList) {
      this.messageList.stopReceiving()
      this.messagesLoaded = false
      if (this.isDisplaying) {
        this.isDisplaying = false
        this.messageList.deselect()
      }
      this.pendingMessages = []
      this.messageList = null
    }
    this.channelHeader.unload()
  }

  focus() {
    if (this.messagesLoaded && !this.isDisplaying) {
      this.isDisplaying = true
      this.messageList.select()
    }
  }

  blur() {
    if (this.isDisplaying) {
      this.isDisplaying = false
      this.messageList.deselect()
    }
  }

  setLoading() {
    if (this.browser.getURL() === loadingUrl)
      return
    this.unload()
    this.channelHeader.view.setVisible(false)
    this.replyBox.setVisible(false)
    this.browser.loadURL(loadingUrl)
  }

  async loadChannel(messageList) {
    this.unload()
    // Show progress bar if we need to fetch messages.
    if (!messageList.messagesReady) {
      this.replyEntry.setEnabled(false)
      this.setLoading()
    }
    this.messageList = messageList
    this.subscription = {
      onMessage: messageList.onMessage.add(this.newMessage.bind(this)),
      onDeleteMessage: messageList.onDeleteMessage.add(this.deleteMessage.bind(this)),
      onModifyMessage: messageList.onModifyMessage.add(this.modifyMessage.bind(this)),
    }
    // Make sure messages are loaded before loading the view.
    this.messageList.startReceiving()
    const messages = await messageList.readMessages()
    this.messagesLoaded = false
    // Start showing the messages.
    if (messageList === this.messageList) {
      this.channelHeader.loadChannel(messageList)
      this.replyBox.setVisible(true)
      // TODO Remember unsent messages.
      this.replyEntry.setText('')
      this.adjustEntryHeight()
      const html = pageTemplate({messageList, messages})
      if (process.env.WEY_DEBUG === '1')
        fs.writeFileSync('page.html', html)
      this.browser.loadHTML(html, messageList.account.url)
    }
  }

  newMessage(message) {
    if (this.threadId && this.threadId !== message.threadId)
      return
    if (!this.messagesLoaded) {
      this.pendingMessages.push(message)
      return
    }
    // Clear unread mark if the new message is the new first unread.
    let firstUnread = false
    if (message.timestamp === this.messageList.firstUnreadTs)
      firstUnread = true
    const html = messageTemplate({messageList: this.messageList, message})
    const fromCurrentUser = message.user.id === this.messageList.account.currentUserId
    this.browser.executeJavaScript(`window.addMessage(${JSON.stringify(html)}, ${firstUnread}, ${fromCurrentUser})`, () => {})
  }

  deleteMessage(id, timestamp) {
    if (this.messagesLoaded)
      this.browser.executeJavaScript(`window.deleteMessage("${id}")`, () => {})
  }

  modifyMessage(id, message) {
    if (this.messagesLoaded) {
      const html = messageTemplate({messageList: this.messageList, message})
      this.browser.executeJavaScript(`window.modifyMessage("${id}", ${JSON.stringify(html)})`, () => {})
    }
  }

  ready() {
    this.replyEntry.setEnabled(true)
    this.replyEntry.focus()
    this.messagesLoaded = true
    for (const m of this.pendingMessages)
      this.newMessage(m)
    this.pendingMessages = []
    if (this.mainWindow.window.isActive()) {
      this.isDisplaying = true
      this.messageList.select()
    }
    this.messageList.notifyRead()
  }

  openLink(link) {
    opn(link)
  }

  copyLink(link) {
    // TODO Add clipboard API in Yue.
    const linkStore = gui.TextEdit.create()
    linkStore.setText(link)
    linkStore.selectAll()
    linkStore.cut()
  }

  openLinkContextMenu(link) {
    const menu = gui.Menu.create([
      { label: 'Copy Link', onClick: this.copyLink.bind(this, link)},
      { label: 'Open Link', onClick: this.openLink.bind(this, link)},
    ])
    menu.popup()
  }

  openChannel(channel) {
    this.mainWindow.channelsPanel.selectChannelById(channel)
  }

  openThread(id) {
    const win = windowManager.windows.find((w) => w.chatBox && w.chatBox.messageList.id === id)
    if (win) {
      win.window.activate()
    } else {
      const ChatWindow = require('./chat-window')
      new ChatWindow(this.messageList.openThread(id), this.view.getBounds())
    }
  }

  adjustEntryHeight() {
    let height = this.replyEntry.getTextBounds().height
    if (height < this.minReplyEntryHeight)
      height = this.minReplyEntryHeight
    else if (height > this.maxReplyEntryHeight)
      height = this.maxReplyEntryHeight
    this.replyEntry.setStyle({height})
  }

  handleEnter(replyEntry) {
    if (gui.Event.isShiftPressed())
      return true
    const message = replyEntry.getText()
    if (message.length == 0 || !this.messageList || this.isSendingReply)
      return false
    replyEntry.setEnabled(false)
    this.isSendingReply = true
    this.messageList
        .sendMessage(message)
        .then((res) => {
          replyEntry.setText('')
          replyEntry.setEnabled(true)
          this.adjustEntryHeight()
          this.isSendingReply = false
        })
        .catch((error) => {
          // TODO Report error
          console.error(error)
          replyEntry.setEnabled(true)
          this.isSendingReply = false
        })
    return false
  }
}

module.exports = ChatBox
