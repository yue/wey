const path = require('path')
const os = require('os')
const fs = require('fs-extra')
const axios = require('axios')

function getCacheDir(name) {
  switch (process.platform) {
    case 'win32':
      if (process.env.LOCALAPPDATA)
        return path.join(process.env.LOCALAPPDATA, name)
      else
        return path.join(os.homedir(), 'AppData', 'Local', name)
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Caches', name)
    case 'linux':
      if (process.env.XDG_CACHE_HOME)
        return path.join(process.env.XDG_CACHE_HOME, name)
      else
        return path.join(os.homedir(), '.cache', name)
    default:
      throw new Error('Unkown platform')
  }
}

class ImageStore {
  constructor() {
    this.dir = getCacheDir(require('../../package.json').build.productName)
  }

  async getImage(category, id, url) {
    await fs.ensureDir(this.dir)
    const p = path.join(this.dir, 'images', category, id)
    const imagePath = p + path.extname(url)
    if (!await fs.pathExists(imagePath)) {
      await fs.ensureFile(imagePath)
      const res = await axios.get(url, {responseType: 'arraybuffer'})
      await fs.writeFile(imagePath, res.data)
    }
    return imagePath
  }
}

module.exports = new ImageStore
