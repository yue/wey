const gui = require('gui')

const windowManager = require('../controller/window-manager')

const imageStore = require('../controller/image-store')

class ProfileWindow {
    constructor(profile) {
        let font = gui.Font.create(gui.Font.default().getName(), 20, 'normal', 'normal')
        this.window = gui.Window.create({})
        this.profileContentView = gui.Container.create()
        this.profileContentView.setStyle({ flexDirection: 'column' })
        this.window.setContentView(this.profileContentView);

        this.title = profile.user.name
        this.text = gui.Label.create(this.title)
        this.text.setAlign('center')
        this.text.setFont(font)
        const labelWidth = this.text.getBounds().width + 50
        this.text.setStyle({ minWidth: labelWidth })
        this.profileContentView.addChildView(this.text)

        this.avatarImage = null;
        this.displayImage(profile)
        console.log()
        this.profileContentView.onDraw = (self, painter) => {
            painter.drawImage(this.avatarImage, { x: 25, y: 40, width: 200, height: 200 })
        }
        this.window.setContentSize({ width: 250, height: 290 })

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

    async displayImage(profile) {
        this.avatarImage = gui.Image.createFromPath(await imageStore.fetchImage(profile.user.avatar))
        this.profileContentView.schedulePaint()
    }
}

module.exports = ProfileWindow