const gui = require('gui')

const AccountsManager = require('./controller/accounts-manager')
const WindowManager = require('./controller/window-manager')

const MainWindow = require('./view/main-window')

const accountsManager = new AccountsManager()
const windowManager = new WindowManager(accountsManager)

const win = new MainWindow()
windowManager.addWindow(win)

win.window.onClose = () => gui.MessageLoop.quit()
win.window.setContentSize({width: 400, height: 400})
win.window.center()
win.window.activate()
