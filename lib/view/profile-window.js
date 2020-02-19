const gui = require('gui')

const windowManager = require('../controller/window-manager')

const imageStore = require('../controller/image-store')

//const messageList2 = require('../model/message-list')

class ProfileWindow {
    constructor(profile, messageList) {
        let font = gui.Font.create(gui.Font.default().getName(), 20, 'normal', 'normal')
        let regFont = gui.Font.create(gui.Font.default().getName(), 16, 'normal', 'normal')
        let headerFont = gui.Font.create(gui.Font.default().getName(), 14, 'light', 'normal')
        let labelWidth
        this.window = gui.Window.create({})
        this.profileContentView = gui.Container.create()
        this.profileContentView.setStyle({ flexDirection: 'column' })
        this.window.setContentView(this.profileContentView);

        if(profile.user.realName){
            this.title = profile.user.realName
            this.text = gui.Label.create(this.title)
            this.text.setAlign('center')
            this.text.setFont(font)
            labelWidth = this.text.getBounds().width + 50
            this.text.setStyle({ minWidth: labelWidth, padding: 20})
            this.profileContentView.addChildView(this.text)
        }

        this.displayNameHeader = 'Display Name'
        this.displayNameHeaderText = gui.Label.create(this.displayNameHeader)
        this.displayNameHeaderText.setAlign('start')
        this.displayNameHeaderText.setFont(headerFont)
        labelWidth = this.displayNameHeaderText.getBounds().width + 50
        this.displayNameHeaderText.setStyle({ minWidth: labelWidth})
        this.profileContentView.addChildView(this.displayNameHeaderText)

        this.displayName = profile.user.name
        this.displayNameText = gui.Label.create(this.displayName)
        this.displayNameText.setAlign('center')
        this.displayNameText.setFont(regFont)
        labelWidth = this.displayNameText.getBounds().width + 50
        this.displayNameText.setStyle({ minWidth: labelWidth, padding: 20})
        this.profileContentView.addChildView(this.displayNameText)

        if(profile.user.email){
            this.emailHeader = 'Email Address'
            this.emailHeaderText = gui.Label.create(this.emailHeader)
            this.emailHeaderText.setAlign('start')
            this.emailHeaderText.setFont(headerFont)
            labelWidth = this.emailHeaderText.getBounds().width + 50
            this.emailHeaderText.setStyle({ minWidth: labelWidth})
            this.profileContentView.addChildView(this.emailHeaderText)

            this.emailT = profile.user.email
            this.emailText = gui.Label.create(this.emailT)
            this.emailText.setAlign('center')
            this.emailText.setFont(regFont)
            labelWidth = this.emailText.getBounds().width + 50
            this.emailText.setStyle({ minWidth: labelWidth, padding: 20})
            this.profileContentView.addChildView(this.emailText)
        }

        if(profile.user.phoneNumber){
            this.phoneNumberHeader = 'Phone Number'
            this.phoneNumberHeaderText = gui.Label.create(this.phoneNumberHeader)
            this.phoneNumberHeaderText.setAlign('start')
            this.phoneNumberHeaderText.setFont(headerFont)
            labelWidth = this.phoneNumberHeaderText.getBounds().width + 50
            this.phoneNumberHeaderText.setStyle({ minWidth: labelWidth})
            this.profileContentView.addChildView(this.phoneNumberHeaderText)

            this.phoneNumberT = profile.user.phoneNumber
            this.phoneNumberText = gui.Label.create(this.phoneNumberT)
            this.phoneNumberText.setAlign('center')
            this.phoneNumberText.setFont(regFont)
            labelWidth = this.phoneNumberText.getBounds().width + 50
            this.phoneNumberText.setStyle({ minWidth: labelWidth, padding: 20})
            this.profileContentView.addChildView(this.phoneNumberText)
        }

        //messageList = messageList2

        this.messageButton = this.createButton(profile.id, messageList)
        this.profileContentView.addChildViewAt(this.messageButton, 0)

        if (!profile.user.isBot) {
            this.avatarImage = null
            this.displayImage(profile)
        }
        this.active = profile.user.isAway
        this.profileContentView.onDraw = (self, painter) => {
            if (!profile.user.isBot) {
                painter.drawImage(this.avatarImage, { x: 50, y: 25, width: 200, height: 200 })
            }
            this.drawPresenceIndicator(painter, this.active, 300 - 50)
        }
        this.window.setContentSize({ width: 300, height: 600 })

        windowManager.addWindow(this)
    }

    getConfig() {
        return {}
    }

    initWithConfig(config) {
        this.window.center()
        this.window.activate()
    }

    unload() {
        this.profileContentView = null
    }

    drawPresenceIndicator(painter, active, bounds) {
        //to be implemented not working now
        const arcPos = {
            x: bounds + 20,
            y: 312
        }

        if (process.platform === 'win32')
            arcPos.x += 2
        painter.beginPath()
        painter.setLineWidth(2)
        painter.arc(arcPos, 6 - (active ? 0.5 : 0), 0, 2 * Math.PI)
        if (active) {
            painter.setStrokeColor('#C1C2C6')
            painter.stroke()
        } else {
            painter.setFillColor('#9FEAF9')
            painter.fill()
        }
    }

    async displayImage(profile) {
        let image = profile.user.avatar;
        image = image.substring(0, image.length - 6) + '512' +  image.substring(image.length - 4, image.length);
        this.avatarImage = gui.Image.createFromPath(await imageStore.fetchImage(image))
        this.profileContentView.schedulePaint()
    }

    createButton(id, messageList){
        const messageButton = gui.Button.create('Message')
        messageButton.setStyle({marginTop: 250, padding: 20})
        messageButton.onClick = () =>{
            const ChatWindow = require('./chat-window')
            new ChatWindow(messageList, this.profileContentView.getBounds())
        }
        return messageButton
    }
}

module.exports = ProfileWindow