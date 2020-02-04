const gui = require('gui')

const windowManager = require('../controller/window-manager')

const imageStore = require('../controller/image-store')

class ProfileWindow {
    constructor(profile) {
        this.window = gui.Window.create({})
        this.profileContentView = gui.Container.create()
        this.profileContentView.setStyle({ flexDirection: 'column' })
        this.window.setContentView(this.profileContentView);
        this.window.setContentSize({ width: 250, height: 325 })

        this.title = profile.user.name
        this.text = gui.Label.create(this.title)
        this.text.setAlign('center')
        this.profileContentView.addChildView(this.text)

        this.avatarImage = null;
        this.displayImage(profile)
        console.log()
        this.profileContentView.onDraw = (self, painter) => {
            painter.drawImage(this.avatarImage, { x: 25, y: 25, width: 200, height: 200 })
        }

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