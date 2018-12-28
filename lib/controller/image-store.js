const crypto = require('crypto')
const path = require('path')
const os = require('os')
const fs = require('fs-extra')
const url = require('url')
const axios = require('axios')

// Manages the caching of Internet files.
// Note that local file operations should be sync to avoid race conditions.
class ImageStore {
  constructor() {
    const {appId, productName} = require('../../package.json').build
    this.dir = path.join(getCacheDir(appId, productName), 'images')
    // Start clearing cache after 1 hour.
    setTimeout(this._doClearCache.bind(this), 1000 * 3600)
  }

  // Is the image already in cache.
  isImageCached(url) {
    return fs.existsSync(this.imagePathFromUrl(url))
  }

  // Compute the cache path of the URL.
  imagePathFromUrl(url) {
    const hash = sha1sum(url)
    return path.join(this.dir, hash + path.extname(url))
  }

  // Return the wey:// protocol to a path.
  weyUrlFromImagePath(path) {
    return url.format({
      slashes: true,
      host: 'file',
      protocol: 'wey',
      pathname: 'image',
      query: {path},
    })
  }

  // Request the URL and return the cache path of it.
  async fetchImage(url, options = {}) {
    const imagePath = this.imagePathFromUrl(url)
    const result = options.returnWeyUrl ? this.weyUrlFromImagePath(imagePath) : imagePath
    const now = Date.now()
    try {
      const stats = fs.statSync(imagePath)
      // Update file date if accessed more than 1 day.
      if (now - stats.atimeMs > 1000 * 3600 * 24)
        fs.utimesSync(imagePath, now / 1000, now / 1000)
      return result
    } catch (e) {
      // Cache miss.
      options = Object.assign(options, {responseType: 'arraybuffer'})
      const res = await axios.get(url, options)
      // Only write cache if URL is image type.
      if (res.headers["content-type"].startsWith('image/')) {
        await fs.ensureFile(imagePath)
        await fs.writeFile(imagePath, res.data)
        return result
      }
    }
    // TODO(zcbenz): Return fallback image.
    return result
  }

  _clearCache() {
    try {
      const files = fs.readdirSync(this.dir)
      const now = Date.now()
      for (const f of files) {
        // Remove file if accessed 7 days ago.
        const p = path.join(this.dir, f)
        const stats = fs.statSync(p)
        if (now - stats.atimeMs > 1000 * 3600 * 24 * 7)
          fs.unlinkSync(p)
      }
    } catch (e) {
      // Ignore error.
    }
  }

  _doClearCache() {
    this._clearCache()
    // Redo cache clearing after 1 day.
    setTimeout(this._doClearCache.bind(this), 1000 * 3600 * 24)
  }
}

function sha1sum(str) {
  const shasum = crypto.createHash('sha1')
  shasum.update(str)
  return shasum.digest('hex')
}

function getCacheDir(appId, name) {
  switch (process.platform) {
    case 'win32':
      if (process.env.LOCALAPPDATA)
        return path.join(process.env.LOCALAPPDATA, name)
      else
        return path.join(os.homedir(), 'AppData', 'Local', name)
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Caches', appId)
    case 'linux':
      if (process.env.XDG_CACHE_HOME)
        return path.join(process.env.XDG_CACHE_HOME, name)
      else
        return path.join(os.homedir(), '.cache', name)
    default:
      throw new Error('Unknown platform')
  }
}

module.exports = new ImageStore
