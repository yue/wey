const url = require('url')

const File = require('../../model/file')

const imageStore = require('../../controller/image-store')

class SlackFile extends File {
  constructor(account, f) {
    super(f.name, f.size, f.filetype)
    this.downloadUrl = f.url_private_download
    this.typeName = f.pretty_type

    if (f.mimetype.startsWith('image/')) {
      this.image = this.downloadUrl
      if (imageStore.isImageCached(this.image)) {
        const imagePath = imageStore.imagePathFromUrl(this.image)
        this.image = imageStore.weyUrlFromImagePath(imagePath)
        this.isImageCached = true
      }
      if (f.original_w) {
        this.imageWidth = Math.min(f.original_w, 360)
        this.imageHeight = f.original_h * this.imageWidth / f.original_w
      } else {
        this.imageWidth = 360
      }
    }
  }
}

function findLargestThumb(file) {
  for (const size of [1024, 960, 800, 720, 480, 360]) {
    if (file[`thumb_${size}`])
      return size
  }
  return null
}

module.exports = SlackFile
