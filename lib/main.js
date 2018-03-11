const gui = require('gui')

const win = gui.Window.create({})
win.setContentSize({width: 400, height: 400})
win.center()
win.onClose = () => gui.MessageLoop.quit()
win.activate()
