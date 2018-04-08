const gui = require('gui')

function main() {
  // Enable GC helper.
  require('./util/gc')

  // Read configurations.
  require('./controller/config-store')

  // The global notification center for managing notifications and tray icons.
  require('./view/notification-center')

  // Show the main window.
  const MainWindow = require('./view/main-window')
  new MainWindow()

  // Capture all errors if succeeded to start.
  require('./util/capture-errors')
}

async function checkSingleInstanceAndStart() {
  if (await require('./util/single-instance').check()) {
    gui.MessageLoop.quit()
    process.exit(0)
  }
  main()
}

if (process.platform === 'darwin') {
  gui.lifetime.onReady = main
} else {
  if (require('./util/single-instance').quickCheckSync())
    checkSingleInstanceAndStart()
  else
    main()
}
