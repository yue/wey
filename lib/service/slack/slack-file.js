const File = require('../../model/file')

class SlackFile extends File {
  constructor(account, f) {
    super(f.name, f.mimetype)

    if (f.mimetype.startsWith('image/')) {
      const size = findLargestThumb(f)
      if (size) {
        this.image = f[`thumb_${size}`]
        this.imageWidth = Math.min(f[`thumb_${size}_w`], 360)
        this.imageHeight = f[`thumb_${size}_h`] * this.imageWidth / f[`thumb_${size}_w`]
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
