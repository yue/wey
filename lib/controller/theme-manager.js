const path = require('path')

class ThemeManager {
  constructor() {
    this.theme = require('../theme/dark')
  }
}

module.exports = new ThemeManager
