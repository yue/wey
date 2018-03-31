const gui = require('gui')

// Called when we have removed bunch of views and objects.
let gcTimer = null
process.gc = (immediate=false) => {
  if (gcTimer)
    clearTimeout(gcTimer)
  if (!immediate) {  // gc after action can cause lagging.
    gcTimer = setTimeout(process.gc.bind(null, true), 5 * 1000)
    return
  }
  if (global.gc)
    gc()
}

// Run gc every 5 minutes.
setInterval(process.gc.bind(null), 5 * 60 * 1000)

// TODO Show message box for the errors.
process.on('uncaughtException', (error) => {
  console.log(error)
})

process.on('unhandledRejection', (error) => {
  console.log(error)
})

// Deserialize the application.
const configStore = require('./controller/config-store')

// Start the main window.
function main() {
  const MainWindow = require('./view/main-window')
  new MainWindow()
}

if (process.platform === 'darwin')
  gui.lifetime.onReady = main
else
  main()
