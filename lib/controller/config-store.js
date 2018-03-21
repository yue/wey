const path = require('path')
const os = require('os')
const fs = require('fs-extra')

const accountsManager = require('./accounts-manager')

const CONFIG_VERSION = 8

function getConfigDir(name) {
  switch (process.platform) {
    case 'win32':
      if (process.env.APPDATA)
        return path.join(process.env.APPDATA, name)
      else
        return path.join(os.homedir(), 'AppData', 'Roaming', name)
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', name)
    case 'linux':
      if (process.env.XDG_CONFIG_HOME)
        return path.join(process.env.XDG_CONFIG_HOME, name)
      else
        return path.join(os.homedir(), '.config', name)
    default:
      throw new Error('Unkown platform')
  }
}

class ConfigStore {
  constructor() {
    this.dir = getConfigDir(require('../../package.json').productName)
    this.file = path.join(this.dir, 'config.json')
    fs.ensureFileSync(this.file)

    // Read config.
    const content = fs.readFileSync(this.file)
    if (content.length === 0)
      fs.writeFileSync(this.file, '{}')
    else
      this.deserialize(JSON.parse(content.toString()))
  }

  serialize() {
    const config = {}
    config.version = CONFIG_VERSION
    config.accounts = accountsManager.serialize()
    fs.writeJsonSync(this.file, config, {spaces: 2})
  }

  deserialize(config) {
    if (config.version != CONFIG_VERSION)
      config = {} // TODO Report error here
    if (config.accounts && Array.isArray(config.accounts))
      accountsManager.deserialize(config.accounts)
  }
}

module.exports = new ConfigStore
