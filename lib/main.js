const gui = require('gui')

process.on('uncaughtException', (error) => {
  console.log(error)
})

process.on('unhandledRejection', (error) => {
  console.log(error)
})

const MainWindow = require('./view/main-window')

const configStore = require('./controller/config-store')

const win = new MainWindow()
win.window.onClose = () => {
  configStore.serialize()
  gui.MessageLoop.quit()
  // Ignore pending Node.js works.
  process.exit(0)
}
win.window.setContentSize({width: 800, height: 600})
win.window.center()
win.window.activate()
