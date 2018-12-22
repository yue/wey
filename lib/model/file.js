class File {
  constructor(name, mimeType) {
    this.name = name
    this.mimeType = mimeType
    this.image = null
    this.imageWidth = null
    this.imageHeight = null
  }
}

module.exports = File
