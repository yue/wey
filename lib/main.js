const gui = require('gui')

process.on('uncaughtException', (error) => {
  console.log(error)
})

process.on('unhandledRejection', (error) => {
  console.log(error)
})

// Deserialize the application.
const configStore = require('./controller/config-store')

const MainWindow = require('./view/main-window')

const win = new MainWindow()
win.window.setContentSize({width: 850, height: 600})
win.window.center()
win.window.activate()
