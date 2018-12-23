const fs = require('fs')
const path = require('path')
const gui = require('gui')
const opn = require('opn')
const fileUrl = require('file-url')

const ChannelHeader = require('./channel-header')

const handlebars = require('./chat/handlebars')
const accountManager = require('../controller/account-manager')
const imageStore = require('../controller/image-store')
const windowManager = require('../controller/window-manager')
const {theme} = require('../controller/theme-manager')

handlebars.registerHelper('isFirstUnread', function(messageList, message, options) {
  if (messageList.firstUnreadTs === message.timestamp)
    return options.fn(this)
  else
    return options.inverse(this)
})

handlebars.registerHelper('isChannel', function(messageList, options) {
  if (messageList.type === 'channel')
    return options.fn(this)
  else
    return options.inverse(this)
})

handlebars.registerHelper('canStartThread', function(messageList, message, options) {
  if (messageList.type !== 'thread' && (!message.threadId || message.isThreadParent))
    return options.fn(this)
  else
    return options.inverse(this)
})

handlebars.registerHelper('normalizeId', function(id) {
  return 'msg' + id.replace('.', '_')
})

handlebars.registerHelper('revert', function(boolean) {
  return boolean ? 'false' : 'true'
})

const fontStyle = fs.readFileSync(path.join(__dirname, 'chat', 'font.css')).toString()
handlebars.registerHelper('fontStyle', function() {
  return fontStyle
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
    this.loadedTimes = 0

    this.view = gui.Container.create()
    this.view.setStyle({flex: 1})

    this.channelHeader = new ChannelHeader()
    // TODO Re-enable header when loading indicator is reimplemented with native
    // UI, otherwise our UI would feel unsmooth.
    // this.view.addChildView(this.channelHeader.view)

    this.browser = gui.Browser.create({
      devtools: true,
      contextMenu: true,
      allowFileAccessFromFiles: true,
    })
    this.browser.setStyle({flex: 1})
    this.browser.setBindingName('wey')
    this.browser.addBinding('ready', this._ready.bind(this))
    this.browser.addBinding('openLink', this._openLink.bind(this))
    this.browser.addBinding('openLinkContextMenu', this._openLinkContextMenu.bind(this))
    this.browser.addBinding('openChannel', this._openChannel.bind(this))
    this.browser.addBinding('openThread', this._openThread.bind(this))
    this.browser.addBinding('setMessageStar', this._setMessageStar.bind(this))
    this.browser.addBinding('setMessageReaction', this._setMessageReaction.bind(this))
    this.browser.addBinding('notifyDisplaying', this._notifyDisplaying.bind(this))
    this.browser.addBinding('notifyNotDisplaying', this._notifyNotDisplaying.bind(this))
    this.browser.addBinding('fetch', this._fetch.bind(this))
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
    this.replyEntry.onTextChange = this._adjustEntryHeight.bind(this)
    this.replyEntry.shouldInsertNewLine = this._handleEnter.bind(this)
    this.replyBox.addChildView(this.replyEntry)

    mainWindow.window.onFocus = this._notifyDisplaying.bind(this)
    mainWindow.window.onBlur = this._notifyNotDisplaying.bind(this)
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
      onMessage: messageList.onMessage.add(this._newMessage.bind(this)),
      onDeleteMessage: messageList.onDeleteMessage.add(this._deleteMessage.bind(this)),
      onModifyMessage: messageList.onModifyMessage.add(this._modifyMessage.bind(this)),
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
      this._adjustEntryHeight()
      const html = pageTemplate({messageList, messages})
      if (process.env.WEY_DEBUG === '1')
        fs.writeFileSync('page.html', html)
      this.loadedTimes++
      // The base URL has to be a fileUrl to allow loading file:// images.
      this.browser.loadHTML(html, fileUrl(path.join(__dirname, 'chat')))
    }
  }

  _newMessage(message) {
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

  _deleteMessage(id, timestamp) {
    if (this.messagesLoaded)
      this.browser.executeJavaScript(`window.deleteMessage("${id}")`, () => {})
  }

  _modifyMessage(id, message) {
    if (this.messagesLoaded) {
      const html = messageTemplate({messageList: this.messageList, message})
      this.browser.executeJavaScript(`window.modifyMessage("${id}", ${JSON.stringify(html)})`, () => {})
    }
  }

  _ready() {
    this.replyEntry.setEnabled(true)
    this.replyEntry.focus()
    this.messagesLoaded = true
    for (const m of this.pendingMessages)
      this._newMessage(m)
    this.pendingMessages = []
    if (this.mainWindow.window.isActive()) {
      this.isDisplaying = true
      this.messageList.select()
    }
    this.messageList.notifyRead()
  }

  _openLink(link) {
    opn(link)
  }

  _copyLink(link) {
    // TODO Add clipboard API in Yue.
    const linkStore = gui.TextEdit.create()
    linkStore.setText(link)
    linkStore.selectAll()
    linkStore.cut()
  }

  _openLinkContextMenu(link) {
    const menu = gui.Menu.create([
      { label: 'Copy Link', onClick: this._copyLink.bind(this, link)},
      { label: 'Open Link', onClick: this._openLink.bind(this, link)},
    ])
    menu.popup()
  }

  _openChannel(channel) {
    this.mainWindow.channelsPanel.selectChannelById(channel)
  }

  _openThread(id) {
    const win = windowManager.windows.find((w) => w.chatBox && w.chatBox.messageList.id === id)
    if (win) {
      win.window.activate()
    } else {
      const ChatWindow = require('./chat-window')
      new ChatWindow(this.messageList.openThread(id), this.view.getBounds())
    }
  }

  _setMessageStar(id, timestamp, hasStar) {
    this.messageList.setMessageStar(id, timestamp, hasStar)
  }

  _setMessageReaction(id, timestamp, name, reacted) {
    this.messageList.setMessageReaction(id, timestamp, name, reacted)
  }

  _notifyDisplaying() {
    if (this.messagesLoaded && !this.isDisplaying) {
      this.isDisplaying = true
      this.messageList.select()
    }
  }

  _notifyNotDisplaying() {
    if (this.isDisplaying) {
      this.isDisplaying = false
      this.messageList.deselect()
    }
  }

  // Download a URL and return local cache file to it.
  async _fetch(url, callbackId) {
    if (!this.messageList)
      return
    // Certain services require authorization for requests.
    const options = {}
    if (this.messageList.account.authorizationHeader)
      options.headers = {'Authorization': this.messageList.account.authorizationHeader}
    // Fetch the URL and disgard result if page has been changed.
    const loadedTimes = this.loadedTimes
    const result = fileUrl(await imageStore.getImage(url, options))
    if (loadedTimes !== this.loadedTimes)
      return
    // Report result back.
    this.browser.executeJavaScript(`window.executeCallback(${callbackId}, "${result}")`, () => {})
  }

  _adjustEntryHeight() {
    let height = this.replyEntry.getTextBounds().height
    if (height < this.minReplyEntryHeight)
      height = this.minReplyEntryHeight
    else if (height > this.maxReplyEntryHeight)
      height = this.maxReplyEntryHeight
    this.replyEntry.setStyle({height})
  }

  _handleEnter(replyEntry) {
    if (gui.Event.isShiftPressed())
      return true
    const message = replyEntry.getText()
    if (message.trim().length == 0 || !this.messageList || this.isSendingReply)
      return false
    replyEntry.setEnabled(false)
    this.isSendingReply = true
    this.messageList
        .sendMessage(message)
        .then((res) => {
          replyEntry.setText('')
          replyEntry.setEnabled(true)
          this._adjustEntryHeight()
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
