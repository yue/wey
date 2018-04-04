const path = require('path')
const gui = require('gui')
const keytar = require('keytar')

const {WebClient, RTMClient} = require('@slack/client')

const Service = require('../../model/service')
const SlackAccount = require('./slack-account')
const SlackChannel = require('./slack-channel')

const FETCH_BUTTON_TEXT = 'Fetch tokens from official Slack app'

class SlackService extends Service {
  constructor() {
    super('slack', 'Slack')
  }

  login() {
    if (this.loginWindow)
      return
    this.createLoginWindow()
    this.loginWindow.center()
    this.loginWindow.activate()
  }

  deserializeAccount(config) {
    return new SlackAccount(this, null, null, config)
  }

  loginWithToken(token) {
    this.loginWindow.setContentView(gui.Label.create('Loading...'))
    const rtm = new RTMClient(token)
    require('./private-apis').extend(rtm)
    rtm.once('unable_to_rtm_start', (error) => {
      console.error(error)
      this.loginWindow.close()
    })
    rtm.once('authenticated', (data) => {
      this.loginWindow.close()
      new SlackAccount(this, data, rtm)
    })
    rtm.start()
  }

  createLoginWindow() {
    this.loginWindow = gui.Window.create({})
    this.loginWindow.setTitle('Login to Slack')
    this.loginWindow.setResizable(false)
    this.loginWindow.onClose = () => this.loginWindow = null

    const contentView = gui.Container.create()
    contentView.setStyle({padding: 10})
    this.loginWindow.setContentView(contentView)

    contentView.addChildView(gui.Label.create('Please login with your personal token'))
    const inputWrapper = gui.Container.create()
    inputWrapper.setStyle({
      flexDirection: 'row',
      marginTop: 5,
      marginBottom: 10,
    })
    contentView.addChildView(inputWrapper)

    const tokenInput = gui.Entry.create()
    const go = () => { this.loginWithToken(tokenInput.getText()) }
    tokenInput.setStyle({
      flex: 1,
      marginRight: 5,
    })
    tokenInput.onActivate = go
    inputWrapper.addChildView(tokenInput)
    const loginButton = gui.Button.create('Login')
    loginButton.onClick = go
    inputWrapper.addChildView(loginButton)

    contentView.addChildView(gui.Label.create('----------- OR -----------'))
    const fetchButton = gui.Button.create(FETCH_BUTTON_TEXT)
    fetchButton.setStyle({marginTop: 10})
    fetchButton.onClick = this.fetchSlackTokens.bind(this)
    contentView.addChildView(fetchButton)

    this.adujstLoginWindowSize()
  }

  adujstLoginWindowSize() {
    this.loginWindow.setContentSize({
      width: 300,
      height: this.loginWindow.getContentView().getPreferredHeightForWidth(300),
    })
  }

  async fetchSlackTokens(fetchButton) {
    fetchButton.setEnabled(false)
    fetchButton.setTitle('Loading...')
    let teams = []
    try {
      const tokens = JSON.parse(await keytar.getPassword('Slack', 'tokens'))
      for (const teamId in tokens) {
        const token = tokens[teamId].token
        const client = new WebClient(token)
        try {
          const info = await client.auth.test()
          teams.push({user: info.user, name: info.team, token})
        } catch (e) {
        }
      }
    } catch (e) {
      fetchButton.setTitle('Retry (Failed to fetch tokens)')
      return
    } finally {
      fetchButton.setEnabled(true)
    }
    if (teams.length == 0) {
      fetchButton.setTitle('Retry (No valid Slack tokens found)')
      return
    }
    for (const team of teams) {
      const button = gui.Button.create(`Login to ${team.name} as ${team.user}`)
      button.setStyle({
        width: '100%',
        marginTop: 10,
      })
      button.onClick = this.loginWithToken.bind(this, team.token)
      this.loginWindow.getContentView().addChildView(button)
    }
    fetchButton.setVisible(false)
    this.adujstLoginWindowSize()
  }
}

module.exports = new SlackService
