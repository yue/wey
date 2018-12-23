const readableSize = require('readable-size')

class File {
  constructor(name, size, type) {
    this.name = name
    this.size = size
    this.type = type
    this.isImageCached = false
    this.downloadUrl = null
    this.image = null
    this.imageWidth = null
    this.imageHeight = null

    this.readableSize = readableSize(size)

    // Certain services provide a pretty name for file types.
    this.typeName = type
  }
}

module.exports = File
