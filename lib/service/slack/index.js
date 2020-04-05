const path = require('path')
const gui = require('gui')
const keytar = require('keytar')

const {WebClient} = require('@slack/web-api')

const Service = require('../../model/service')
const SlackAccount = require('./slack-account')
const SlackChannel = require('./slack-channel')

const FETCH_BUTTON_TEXT = 'Fetch tokens from official Slack app'

class SlackService extends Service {
  constructor() {
    super('slack', 'Slack')
  }

  login() {
    if (this.loginWindow) {
      this.loginWindow.activate()
      return
    }
    this.createLoginWindow()
    this.loginWindow.center()
    this.loginWindow.activate()
  }

  createAccount(id, name, token) {
    return new SlackAccount(this, id, name, token)
  }

  async loginWithToken(token, button) {
    // Set loading information.
    if (button) {
      button.setTitle("Loading...")
      button.setEnabled(false)
    } else {
      this.loginWindow.setContentView(gui.Label.create('Loading...'))
    }
    try {
      // Test the token.
      const client = new WebClient(token)
      const data = await client.auth.test()
      this.createAccount(data.team_id, data.team, token)
      // Succeeded.
      if (button) {
        this.loginWindow.getContentView().removeChildView(button)
        this.adujstLoginWindowSize()
      } else {
        this.loginWindow.close()
      }
    } catch (e) {
      // Report error.
      const message = e.message.startsWith('An API error occurred: ') ?  e.message.substr(23) : e.message
      if (button) {
        button.setEnabled(true)
        button.setTitle(`Retry (${message})`)
      } else {
        this.loginWindow.setContentView(gui.Label.create(message))
      }
    }
  }

  createLoginWindow() {
    this.loginWindow = gui.Window.create({})
    this.loginWindow.setTitle('Login to Slack')
    this.loginWindow.onClose = () => this.loginWindow = null

    const contentView = gui.Container.create()
    contentView.setStyle({padding: 10})
    this.loginWindow.setContentView(contentView)

    const row1 = this.createRow(contentView)
    const label11 = gui.Label.create('Workspace')
    row1.addChildView(label11)
    const labelWidth = label11.getBounds().width + 5
    label11.setAlign('start')
    label11.setStyle({minWidth: labelWidth})
    const teamInput = gui.Entry.create()
    teamInput.setStyle({flex: 1})
    row1.addChildView(teamInput)
    const label12 = gui.Label.create('.slack.com')
    row1.addChildView(label12)

    const row2 = this.createRow(contentView)
    const label21 = gui.Label.create('E-mail')
    label21.setAlign('start')
    label21.setStyle({minWidth: labelWidth})
    row2.addChildView(label21)
    const emailInput = gui.Entry.create()
    emailInput.setStyle({flex: 1})
    row2.addChildView(emailInput)

    const row3 = this.createRow(contentView)
    const label31 = gui.Label.create('Password')
    label31.setAlign('start')
    label31.setStyle({minWidth: labelWidth})
    row3.addChildView(label31)
    const passInput = gui.Entry.createType('password')
    passInput.setStyle({flex: 1})
    row3.addChildView(passInput)

    const loginButton = gui.Button.create('Login')
    loginButton.setStyle({marginBottom: 10})
    loginButton.onClick = this.exchangeToken.bind(this, teamInput, emailInput, passInput)
    passInput.onActivate = this.exchangeToken.bind(this, teamInput, emailInput, passInput, loginButton)
    contentView.addChildView(loginButton)

    contentView.addChildView(gui.Label.create('----------- OR -----------'))
    const fetchButton = gui.Button.create(FETCH_BUTTON_TEXT)
    fetchButton.setStyle({marginTop: 10})
    fetchButton.onClick = this.fetchSlackTokens.bind(this)
    contentView.addChildView(fetchButton)

    this.adujstLoginWindowSize()
  }

  adujstLoginWindowSize() {
    this.loginWindow.setContentSize({
      width: 400,
      height: this.loginWindow.getContentView().getPreferredHeightForWidth(400),
    })
  }

  createRow(contentView) {
    const row = gui.Container.create()
    row.setStyle({flexDirection: 'row', marginBottom: 5})
    contentView.addChildView(row)
    return row
  }

  async exchangeToken(teamInput, emailInput, passInput, loginButton) {
    loginButton.setEnabled(false)
    loginButton.setTitle('Loading...')
    const client = new WebClient()
    require('./private-apis').extend(client)
    try {
      const {team_id} = await client.auth.findTeam({domain: teamInput.getText()})
      const {token} = await client.auth.signin({
        email: emailInput.getText(),
        password: passInput.getText(),
        team: team_id,
      })
      this.loginWithToken(token)
    } catch (e) {
      const message = e.message.startsWith('An API error occurred: ') ?  e.message.substr(23) : e.message
      loginButton.setEnabled(true)
      loginButton.setTitle(`Retry (${message})`)
    }
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
      button.onClick = this.loginWithToken.bind(this, team.token, button)
      this.loginWindow.getContentView().addChildView(button)
    }
    fetchButton.setVisible(false)
    this.adujstLoginWindowSize()
  }
}

module.exports = new SlackService
