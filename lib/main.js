const gui = require('gui')

const MainWindow = require('./view/main-window')

const configStore = require('./controller/config-store')

const win = new MainWindow()
win.window.onClose = () => {
  configStore.serialize()
  gui.MessageLoop.quit()
  // Ignore pending Node.js works.
  process.exit(0)
}
win.window.setContentSize({width: 400, height: 400})
win.window.center()
win.window.activate()
